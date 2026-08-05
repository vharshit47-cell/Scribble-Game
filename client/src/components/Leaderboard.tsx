import { AnimatePresence, motion } from "framer-motion";
import { Player } from "../types/game.types";
import PlayerCard from "./PlayerCard";

interface Props {
  players: Player[];
}

export default function Leaderboard({ players }: Props) {
  const ranked = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="glass-card p-4 flex flex-col gap-2 w-full">
      <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-1">
        Leaderboard
      </h3>
      <AnimatePresence>
        <motion.div layout className="flex flex-col gap-2">
          {ranked.map((p, i) => (
            <PlayerCard key={p.id} player={p} rank={i} />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
