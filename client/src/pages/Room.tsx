import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { socket } from "../services/socket";
import { useGameStore } from "../store/gameStore";
import Lobby from "./Lobby";
import GameRoom from "./GameRoom";
import GameEndScreen from "../components/GameEndScreen";

export default function Room() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const room = useGameStore((s) => s.room);
  const username = useGameStore((s) => s.username);
  const avatar = useGameStore((s) => s.avatar);
  const finalStandings = useGameStore((s) => s.finalStandings);

  useEffect(() => {
    if (!code) return;
    // Refresh/direct-link support: if we don't yet have identity in the
    // store (e.g. page reload), bounce back to landing to re-enter it.
    if (!username) {
      navigate("/");
      return;
    }
    if (!socket.connected) socket.connect();
    socket.emit("reconnectToRoom", { code });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  if (!code) return null;

  if (finalStandings) {
    return <GameEndScreen standings={finalStandings} />;
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full"
        />
      </div>
    );
  }

  return room.phase === "lobby" ? <Lobby /> : <GameRoom />;
}
