import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { socket } from "../services/socket";
import { useGameStore } from "../store/gameStore";

export default function Lobby() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const [copied, setCopied] = useState(false);

  const isHost = room.hostId === selfId;

  const copyCode = () => {
    navigator.clipboard.writeText(room.code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const startGame = () => {
    socket.emit("startGame", { code: room.code });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-8 w-full max-w-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-white/40">Room code</p>
            <button
              onClick={copyCode}
              className="text-2xl font-mono font-bold tracking-widest hover:text-primary transition-colors"
            >
              {room.code} {copied ? "✓" : "📋"}
            </button>
          </div>
          <div className="text-right text-xs text-white/40">
            <p>{room.settings.rounds} rounds · {room.settings.difficulty}</p>
            <p>{room.players.length}/{room.settings.maxPlayers} players</p>
          </div>
        </div>

        <AnimatePresence>
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {room.players.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card flex flex-col items-center gap-1 py-4"
              >
                <span className="text-3xl">{p.avatar}</span>
                <span className="text-sm font-medium truncate max-w-full px-2">{p.username}</span>
                {p.isHost && <span className="text-xs text-warning">Host 👑</span>}
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {isHost ? (
          <button
            onClick={startGame}
            disabled={room.players.length < 2}
            className="btn-primary w-full"
          >
            {room.players.length < 2 ? "Waiting for more players..." : "Start Game 🚀"}
          </button>
        ) : (
          <p className="text-center text-white/50 text-sm">Waiting for the host to start the game...</p>
        )}
      </motion.div>
    </div>
  );
}
