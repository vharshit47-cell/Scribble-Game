import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { socket } from "../services/socket";
import { useGameStore } from "../store/gameStore";

interface Props {
  roomCode: string;
  disabled: boolean; // true for the drawer, or after guessing correctly
}

export default function ChatBox({ roomCode, disabled }: Props) {
  const chat = useGameStore((s) => s.chat);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [chat.length]);

  const send = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    socket.emit("guess", { code: roomCode, text: trimmed });
    setText("");
  };

  return (
    <div className="glass-card flex flex-col h-full min-h-[300px]">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
        {chat.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-sm rounded-lg px-2.5 py-1.5 ${
              m.type === "system"
                ? "text-white/40 italic text-xs"
                : m.type === "correct-guess"
                ? "bg-accent/15 text-accent font-medium"
                : "text-ink"
            }`}
          >
            {m.type !== "system" && (
              <span className="font-semibold mr-1">{m.username}:</span>
            )}
            {m.type === "correct-guess" ? "✅ guessed the word!" : m.text}
          </motion.div>
        ))}
      </div>
      <div className="p-2.5 border-t border-white/10 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={disabled}
          placeholder={disabled ? "You can't guess right now" : "Type your guess..."}
          className="input-field !py-2 text-sm"
          maxLength={200}
        />
        <button onClick={send} disabled={disabled} className="btn-primary !px-4 !py-2 text-sm">
          Send
        </button>
      </div>
    </div>
  );
}
