import { motion, AnimatePresence } from "framer-motion";
import CircularTimer from "./CircularTimer";
import { socket } from "../services/socket";

interface Props {
  roomCode: string;
  choices: string[] | null;
  selectionEndsAt: number | null;
  isDrawer: boolean;
  drawerName: string;
}

export default function WordSelectionOverlay({
  roomCode,
  choices,
  selectionEndsAt,
  isDrawer,
  drawerName,
}: Props) {
  if (!choices) return null;

  const choose = (word: string) => {
    socket.emit("chooseWord", { code: roomCode, word });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-8 flex flex-col items-center gap-5 max-w-md"
        >
          {isDrawer ? (
            <>
              <h2 className="text-xl font-bold">Choose a word to draw</h2>
              <CircularTimer endsAt={selectionEndsAt} totalSeconds={15} />
              <div className="flex flex-col gap-3 w-full">
                {choices.map((w) => (
                  <button
                    key={w}
                    onClick={() => choose(w)}
                    className="btn-secondary hover:!bg-primary/20 hover:!border-primary text-base"
                  >
                    {w}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold">{drawerName} is choosing a word...</h2>
              <CircularTimer endsAt={selectionEndsAt} totalSeconds={15} />
              <p className="text-white/50 text-sm">Get ready to guess!</p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
