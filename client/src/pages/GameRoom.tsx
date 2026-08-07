import { motion } from "framer-motion";
import { useGameStore } from "../store/gameStore";
import DrawingCanvas from "../components/DrawingCanvas";
import CircularTimer from "../components/CircularTimer";
import Leaderboard from "../components/Leaderboard";
import PlayerCard from "../components/PlayerCard";
import ChatBox from "../components/ChatBox";
import WordSelectionOverlay from "../components/WordSelectionOverlay";
import RoundSummaryOverlay from "../components/RoundSummaryOverlay";

export default function GameRoom() {
  const room = useGameStore((s) => s.room)!;
  const selfId = useGameStore((s) => s.selfId);
  const wordChoices = useGameStore((s) => s.wordChoices);
  const selectionEndsAt = useGameStore((s) => s.selectionEndsAt);
  const yourWord = useGameStore((s) => s.yourWord);
  const roundSummary = useGameStore((s) => s.roundSummary);

  const isDrawer = room.currentDrawerId === selfId;
  const self = room.players.find((p) => p.id === selfId);
  const drawer = room.players.find((p) => p.id === room.currentDrawerId);

  const chatDisabled = isDrawer || !!self?.hasGuessedCorrectly;

  return (
    <div className="min-h-screen px-4 py-6 flex flex-col gap-4 max-w-7xl mx-auto">
      <WordSelectionOverlay
        roomCode={room.code}
        choices={wordChoices}
        selectionEndsAt={selectionEndsAt}
        isDrawer={isDrawer}
        drawerName={drawer?.username ?? ""}
      />
      <RoundSummaryOverlay summary={roundSummary} />

      <div className="glass-card px-5 py-3 flex items-center justify-between">
        <div className="text-sm text-white/50">
          Round <span className="text-ink font-semibold">{room.currentRound}</span> / {room.totalRounds}
        </div>

        <div className="flex flex-col items-center">
          {isDrawer ? (
            <span className="text-lg font-bold tracking-[0.3em]">{yourWord}</span>
          ) : (
            <span className="text-lg font-bold tracking-[0.3em]">{room.maskedWord}</span>
          )}
          <span className="text-xs text-white/40">
            {drawer?.username} is drawing {isDrawer && "(you)"}
          </span>
        </div>

        <CircularTimer endsAt={room.turnEndsAt} totalSeconds={room.settings.turnDurationSeconds} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_280px] gap-4">
        <div className="order-2 lg:order-1 flex flex-col gap-2">
          {room.players.map((p) => (
            <PlayerCard key={p.id} player={p} />
          ))}
        </div>

        <div className="order-1 lg:order-2 flex justify-center">
          <DrawingCanvas roomCode={room.code} isDrawer={isDrawer} />
        </div>

        <div className="order-3 flex flex-col gap-4">
          <ChatBox roomCode={room.code} disabled={chatDisabled} />
        </div>
      </div>

      <div className="lg:hidden">
        <Leaderboard players={room.players} />
      </div>
    </div>
  );
}
