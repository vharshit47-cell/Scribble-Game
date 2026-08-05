import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { socket } from "../services/socket";
import { DrawEvent, Stroke } from "../types/game.types";

const COLORS = [
  "#F8FAFC", "#EF4444", "#FACC15", "#22C55E", "#6366F1",
  "#EC4899", "#0EA5E9", "#F97316", "#A855F7", "#000000",
];

const CANVAS_W = 900;
const CANVAS_H = 600;

interface Props {
  roomCode: string;
  isDrawer: boolean;
}

export default function DrawingCanvas({ roomCode, isDrawer }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const redoStackRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const isPointerDown = useRef(false);
  const lastEmit = useRef(0);

  const [color, setColor] = useState("#F8FAFC");
  const [size, setSize] = useState(6);
  const [tool, setTool] = useState<"brush" | "eraser">("brush");

  const getCtx = () => {
    if (!ctxRef.current && canvasRef.current) {
      ctxRef.current = canvasRef.current.getContext("2d");
    }
    return ctxRef.current;
  };

  const clearCanvasVisual = useCallback(() => {
    const ctx = getCtx();
    if (!ctx) return;
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  const drawStroke = useCallback((stroke: Stroke) => {
    const ctx = getCtx();
    if (!ctx || stroke.points.length === 0) return;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.strokeStyle = stroke.tool === "eraser" ? "#FFFFFF" : stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (const p of stroke.points.slice(1)) ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }, []);

  const redrawAll = useCallback(() => {
    clearCanvasVisual();
    strokesRef.current.forEach(drawStroke);
  }, [clearCanvasVisual, drawStroke]);

  // Initialize + listen for remote events.
  useEffect(() => {
    clearCanvasVisual();

    const onRemoteDraw = (event: DrawEvent) => {
      if (event.type === "start") {
        currentStrokeRef.current = {
          id: event.strokeId!,
          points: [{ x: event.x!, y: event.y! }],
          color: event.color!,
          size: event.size!,
          tool: (event.tool as "brush" | "eraser") ?? "brush",
        };
      } else if (event.type === "draw" && currentStrokeRef.current) {
        currentStrokeRef.current.points.push({ x: event.x!, y: event.y! });
        const ctx = getCtx();
        if (ctx) {
          const pts = currentStrokeRef.current.points;
          const prev = pts[pts.length - 2] ?? pts[0];
          ctx.strokeStyle =
            currentStrokeRef.current.tool === "eraser"
              ? "#FFFFFF"
              : currentStrokeRef.current.color;
          ctx.lineWidth = currentStrokeRef.current.size;
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(event.x!, event.y!);
          ctx.stroke();
        }
      } else if (event.type === "end" && currentStrokeRef.current) {
        strokesRef.current.push(currentStrokeRef.current);
        currentStrokeRef.current = null;
      } else if (event.type === "replay" && event.strokes) {
        strokesRef.current = event.strokes;
        redrawAll();
      }
    };

    const onClear = () => {
      strokesRef.current = [];
      clearCanvasVisual();
    };

    socket.on("drawing", onRemoteDraw);
    socket.on("clearCanvas", onClear);
    return () => {
      socket.off("drawing", onRemoteDraw);
      socket.off("clearCanvas", onClear);
    };
  }, [clearCanvasVisual, redrawAll]);

  // Reset local canvas whenever a new turn begins for everyone.
  useEffect(() => {
    strokesRef.current = [];
    redoStackRef.current = [];
    clearCanvasVisual();
  }, [roomCode, clearCanvasVisual]);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_W / rect.width;
    const scaleY = CANVAS_H / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const emit = (event: DrawEvent) => {
    socket.emit("drawing", { code: roomCode, event });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    isPointerDown.current = true;
    const { x, y } = getPos(e);
    const strokeId = `${Date.now()}-${Math.random()}`;
    currentStrokeRef.current = { id: strokeId, points: [{ x, y }], color, size, tool };
    redoStackRef.current = [];
    const ctx = getCtx();
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
    emit({ type: "start", x, y, color, size, tool, strokeId });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isPointerDown.current || !currentStrokeRef.current) return;
    const { x, y } = getPos(e);
    currentStrokeRef.current.points.push({ x, y });

    const ctx = getCtx();
    if (ctx) {
      ctx.strokeStyle = tool === "eraser" ? "#FFFFFF" : color;
      ctx.lineWidth = size;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    // Throttle network emission (~40 events/sec max) without affecting local smoothness.
    const now = performance.now();
    if (now - lastEmit.current > 25) {
      lastEmit.current = now;
      emit({ type: "draw", x, y });
    }
  };

  const handlePointerUp = () => {
    if (!isDrawer || !currentStrokeRef.current) return;
    isPointerDown.current = false;
    strokesRef.current.push(currentStrokeRef.current);
    emit({ type: "end" });
    currentStrokeRef.current = null;
  };

  const handleClear = () => {
    if (!isDrawer) return;
    strokesRef.current = [];
    redoStackRef.current = [];
    clearCanvasVisual();
    socket.emit("clearCanvas", { code: roomCode });
  };

  const handleUndo = () => {
    if (!isDrawer || strokesRef.current.length === 0) return;
    const popped = strokesRef.current.pop()!;
    redoStackRef.current.push(popped);
    redrawAll();
    emit({ type: "replay", strokes: strokesRef.current });
  };

  const handleRedo = () => {
    if (!isDrawer || redoStackRef.current.length === 0) return;
    const restored = redoStackRef.current.pop()!;
    strokesRef.current.push(restored);
    redrawAll();
    emit({ type: "replay", strokes: strokesRef.current });
  };

  return (
    <div className="flex flex-col gap-3 items-center w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl overflow-hidden shadow-float border border-white/10 w-full max-w-3xl"
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className={`w-full h-auto bg-white ${isDrawer ? "cursor-crosshair" : "cursor-not-allowed"}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        />
      </motion.div>

      {isDrawer && (
        <div className="glass-card flex flex-wrap items-center gap-3 px-4 py-3 w-full max-w-3xl">
          <div className="flex items-center gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setColor(c);
                  setTool("brush");
                }}
                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${
                  color === c && tool === "brush" ? "border-primary scale-110" : "border-white/20"
                }`}
                style={{ backgroundColor: c }}
                aria-label={`color ${c}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2 ml-2">
            <input
              type="range"
              min={2}
              max={30}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-24 accent-primary"
            />
            <span className="text-xs text-white/60 w-6">{size}</span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => setTool("eraser")}
              className={`btn-secondary !px-3 !py-1.5 text-sm ${tool === "eraser" ? "ring-2 ring-primary" : ""}`}
            >
              🧽 Eraser
            </button>
            <button onClick={handleUndo} className="btn-secondary !px-3 !py-1.5 text-sm">
              ↩ Undo
            </button>
            <button onClick={handleRedo} className="btn-secondary !px-3 !py-1.5 text-sm">
              ↪ Redo
            </button>
            <button
              onClick={handleClear}
              className="btn-secondary !px-3 !py-1.5 text-sm text-danger"
            >
              🗑 Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
