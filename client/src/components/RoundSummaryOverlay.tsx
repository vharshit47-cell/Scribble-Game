import { motion, AnimatePresence } from "framer-motion";
import { RoundStanding } from "../types/game.types";

interface Props {
  summary: { round: number; totalRounds: number; standings: RoundStanding[] } | null;
}

const MEDALS = ["🥇", "🥈", "🥉"];

export default function RoundSummaryOverlay({ summary }: Props) {
  if (!summary) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-bg/90 backdrop-blur-md z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="glass-card p-8 w-full max-w-lg flex flex-col gap-4"
        >
          <h2 className="text-2xl font-bold text-center">
            Round {summary.round} / {summary.totalRounds} Complete
          </h2>
          <div className="flex flex-col gap-2 mt-2">
            {summary.standings.map((s, i) => (
              <motion.div
                key={s.playerId}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.08 }}
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl ${
                  i === 0 ? "bg-warning/15 border border-warning/30" : "bg-white/5"
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  {MEDALS[i] ?? `#${i + 1}`} {s.username}
                </span>
                <span className="font-bold">{s.score} pts</span>
              </motion.div>
            ))}
          </div>
          <p className="text-center text-white/40 text-sm mt-2">
            Next round starting shortly...
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
