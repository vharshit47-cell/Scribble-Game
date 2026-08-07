import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { socket } from "../services/socket";
import { useGameStore } from "../store/gameStore";
import { AVATARS, randomAvatar } from "../utils/avatars";
import { Difficulty, RoomSettings } from "../types/game.types";

type View = "home" | "create" | "join";

export default function Landing() {
  const navigate = useNavigate();
  const setIdentity = useGameStore((s) => s.setIdentity);
  const joinError = useGameStore((s) => s.joinError);
  const setJoinError = useGameStore((s) => s.setJoinError);

  const [view, setView] = useState<View>("home");
  const [username, setUsername] = useState("");
  const [avatar, setAvatar] = useState(randomAvatar());
  const [roomCode, setRoomCode] = useState("");

  const [rounds, setRounds] = useState<RoomSettings["rounds"]>(10);
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [isPrivate, setIsPrivate] = useState(false);

  const ready = username.trim().length >= 2;

  const goCreate = () => {
    if (!ready) return;
    setIdentity(username.trim(), avatar);
    if (!socket.connected) socket.connect();
    socket.off("roomCreated");
    socket.once("roomCreated", ({ code }: { code: string }) => {
      navigate(`/room/${code}`);
    });
    socket.emit("createRoom", {
      username: username.trim(),
      avatar,
      rounds,
      difficulty,
      maxPlayers,
      isPrivate,
    });
  };

  const goJoin = () => {
    if (!ready || roomCode.trim().length < 4) return;
    setJoinError(null);
    setIdentity(username.trim(), avatar);
    if (!socket.connected) socket.connect();
    socket.off("roomJoined");
    socket.once("roomJoined", ({ code }: { code: string }) => {
      navigate(`/room/${code}`);
    });
    socket.emit("joinRoom", {
      code: roomCode.trim().toUpperCase(),
      username: username.trim(),
      avatar,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
      <FloatingParticles />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-8 w-full max-w-md relative z-10"
      >
        <motion.h1
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="text-3xl font-black text-center mb-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
        >
          Doodle Duel
        </motion.h1>
        <p className="text-center text-white/40 text-sm mb-6">Draw. Guess. Win.</p>

        <div className="mb-5">
          <label className="text-xs text-white/50 mb-1.5 block">Your name</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter a username"
            maxLength={20}
            className="input-field"
          />
        </div>

        <div className="mb-6">
          <label className="text-xs text-white/50 mb-1.5 block">Avatar</label>
          <div className="grid grid-cols-8 gap-1.5">
            {AVATARS.slice(0, 16).map((a) => (
              <button
                key={a}
                onClick={() => setAvatar(a)}
                className={`text-xl rounded-lg py-1 transition-all hover:scale-110 ${
                  avatar === a ? "bg-primary/30 ring-2 ring-primary" : "bg-white/5"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        {view === "home" && (
          <div className="flex flex-col gap-3">
            <button disabled={!ready} onClick={() => setView("create")} className="btn-primary w-full">
              🎨 Create Room
            </button>
            <button disabled={!ready} onClick={() => setView("join")} className="btn-secondary w-full">
              🔑 Join Room
            </button>
          </div>
        )}

        {view === "create" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Rounds</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRounds(r as RoomSettings["rounds"])}
                    className={`btn-secondary !py-1.5 text-sm ${rounds === r ? "ring-2 ring-primary" : ""}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Difficulty</label>
              <div className="grid grid-cols-3 gap-2">
                {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`btn-secondary !py-1.5 text-sm capitalize ${difficulty === d ? "ring-2 ring-primary" : ""}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">
                Max players: {maxPlayers}
              </label>
              <input
                type="range"
                min={2}
                max={12}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="accent-primary"
              />
              Private room (invite only, via code)
            </label>
            <div className="flex gap-2 mt-1">
              <button onClick={() => setView("home")} className="btn-secondary flex-1">Back</button>
              <button onClick={goCreate} className="btn-primary flex-1">Create</button>
            </div>
          </div>
        )}

        {view === "join" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Room code</label>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB12CD"
                maxLength={8}
                className="input-field tracking-widest text-center font-mono"
              />
              {joinError && <p className="text-danger text-xs mt-1.5">{joinError}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView("home")} className="btn-secondary flex-1">Back</button>
              <button onClick={goJoin} className="btn-primary flex-1">Join</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function FloatingParticles() {
  const particles = Array.from({ length: 18 });
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-primary/30"
          initial={{
            x: `${Math.random() * 100}%`,
            y: `${Math.random() * 100}%`,
            opacity: 0,
          }}
          animate={{
            y: [null, "-20%"],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 6,
          }}
        />
      ))}
    </div>
  );
}
