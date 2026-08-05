import { motion, AnimatePresence } from "framer-motion";
import { Player } from "../types/game.types";
import { useGameStore } from "../store/gameStore";

interface Props {
  player: Player;
  rank?: number;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function PlayerCard({ player, rank }: Props) {
  const scoreFloats = useGameStore((s) => s.scoreFloats.filter((f) => f.playerId === player.id));
  const clearScoreFloat = useGameStore((s) => s.clearScoreFloat);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className={`relative glass-card flex items-center gap-3 px-3 py-2.5 ${
        player.isDrawing ? "ring-2 ring-accent shadow-glow" : ""
      } ${!player.connected ? "opacity-40" : ""}`}
    >
      <div className="relative text-2xl">
        {player.avatar}
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-card ${
            player.connected ? "bg-accent" : "bg-white/20"
          }`}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-medium truncate">{player.username}</span>
          {player.isHost && <span title="Host">👑</span>}
          {player.hasGuessedCorrectly && <span title="Guessed correctly">✅</span>}
        </div>
        <div className="text-xs text-white/50">{player.score} pts</div>
      </div>

      {rank !== undefined && rank < 3 && (
        <span className="text-lg">{MEDALS[rank]}</span>
      )}

      <AnimatePresence>
        {scoreFloats.map((f) => (
          <motion.span
            key={f.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -30, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1 }}
            onAnimationComplete={() => clearScoreFloat(f.id)}
            className="absolute right-2 top-0 text-accent font-bold text-sm pointer-events-none"
          >
            +{f.points}
          </motion.span>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
