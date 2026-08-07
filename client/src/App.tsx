import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSocketEvents } from "./hooks/useSocketEvents";
import { useGameStore } from "./store/gameStore";
import Landing from "./pages/Landing";
import Room from "./pages/Room";

export default function App() {
  useSocketEvents();
  const toast = useGameStore((s) => s.toast);
  const setToast = useGameStore((s) => s.setToast);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast, setToast]);

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-primary/90 text-white font-medium text-sm px-5 py-2.5 rounded-full shadow-float border border-white/20 backdrop-blur-md pointer-events-auto cursor-pointer"
            onClick={() => setToast(null)}
          >
            💡 {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room/:code" element={<Room />} />
      </Routes>
    </>
  );
}

