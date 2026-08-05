import { Routes, Route } from "react-router-dom";
import { useSocketEvents } from "./hooks/useSocketEvents";
import Landing from "./pages/Landing";
import Room from "./pages/Room";

export default function App() {
  useSocketEvents();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/room/:code" element={<Room />} />
    </Routes>
  );
}
