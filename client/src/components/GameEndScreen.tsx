import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { RoundStanding } from "../types/game.types";
import { socket } from "../services/socket";
import { useGameStore } from "../store/gameStore";

interface Props {
  standings: RoundStanding[];
}

const PODIUM_ORDER = [1, 0, 2]; // silver, gold, bronze visual arrangement
const PODIUM_HEIGHT = ["h-28", "h-40", "h-20"];
const MEDALS = ["🥈", "🥇", "🥉"];

export default function GameEndScreen({ standings }: Props) {
  const navigate = useNavigate();
  const reset = useGameStore((s) => s.reset);
  const top3 = standings.slice(0, 3);

  const playAgain = () => {
    reset();
    navigate("/");
  };

  const leaveToLobby = () => {
    socket.emit("leaveRoom", {});
    reset();
    navigate("/");
  };

  return (
    <div className="fixed inset-0 bg-bg z-50 flex flex-col items-center justify-center gap-8 px-4 overflow-y-auto py-10">
      <motion.h1
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120 }}
        className="text-4xl md:text-5xl font-black text-center"
      >
        🏆 {standings[0]?.username} Wins!
      </motion.h1>

      <div className="flex items-end gap-4">
        {PODIUM_ORDER.map((idx, i) => {
          const player = top3[idx];
          if (!player) return <div key={i} className="w-24" />;
          return (
            <motion.div
              key={player.playerId}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.15 }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-3xl">{MEDALS[i]}</span>
              <span className="font-semibold text-sm truncate max-w-[90px]">{player.username}</span>
              <span className="text-white/50 text-xs">{player.score} pts</span>
              <div
                className={`w-24 ${PODIUM_HEIGHT[i]} rounded-t-xl bg-gradient-to-t from-primary/40 to-primary/10 border border-white/10`}
              />
            </motion.div>
          );
        })}
      </div>

      <div className="glass-card p-4 w-full max-w-md flex flex-col gap-1.5">
        {standings.map((s, i) => (
          <div key={s.playerId} className="flex justify-between px-3 py-1.5 text-sm">
            <span>#{i + 1} {s.username}</span>
            <span className="font-semibold">{s.score} pts</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={playAgain} className="btn-primary">Play Again</button>
        <button onClick={leaveToLobby} className="btn-secondary">Back to Home</button>
      </div>
    </div>
  );
}
