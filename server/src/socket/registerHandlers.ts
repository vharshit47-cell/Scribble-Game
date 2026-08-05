import { Server, Socket } from "socket.io";
import { GameManager } from "../services/GameManager";
import { RoomSettings, DrawEvent } from "../types/game.types";

const DEFAULT_SETTINGS: Partial<RoomSettings> = {
  turnDurationSeconds: 80,
};

// Very small in-memory rate limiter per socket for guesses/drawing spam.
const guessTimestamps = new Map<string, number[]>();
const GUESS_WINDOW_MS = 3000;
const GUESS_MAX_IN_WINDOW = 8;

function isRateLimited(socketId: string): boolean {
  const now = Date.now();
  const arr = (guessTimestamps.get(socketId) ?? []).filter(
    (t) => now - t < GUESS_WINDOW_MS
  );
  arr.push(now);
  guessTimestamps.set(socketId, arr);
  return arr.length > GUESS_MAX_IN_WINDOW;
}

function sanitizeUsername(raw: string): string {
  return raw.trim().replace(/[<>]/g, "").slice(0, 20) || "Player";
}

function sanitizeText(raw: string): string {
  return raw.trim().replace(/[<>]/g, "").slice(0, 200);
}

export function registerHandlers(io: Server, socket: Socket, gm: GameManager) {
  socket.on(
    "createRoom",
    (payload: {
      username: string;
      avatar: string;
      rounds: RoomSettings["rounds"];
      difficulty: RoomSettings["difficulty"];
      maxPlayers: number;
      isPrivate: boolean;
    }) => {
      const settings: RoomSettings = {
        rounds: payload.rounds ?? 10,
        difficulty: payload.difficulty ?? "medium",
        maxPlayers: Math.min(Math.max(payload.maxPlayers ?? 8, 2), 12),
        isPrivate: !!payload.isPrivate,
        turnDurationSeconds: DEFAULT_SETTINGS.turnDurationSeconds!,
      };
      const room = gm.createRoom(
        socket.id,
        sanitizeUsername(payload.username),
        payload.avatar || "avatar-1",
        settings
      );
      socket.join(room.code);
      socket.emit("roomCreated", { code: room.code });
      gm.broadcastState(room);
    }
  );

  socket.on(
    "joinRoom",
    (payload: { code: string; username: string; avatar: string }) => {
      const { room, error } = gm.joinRoom(
        payload.code,
        socket.id,
        sanitizeUsername(payload.username),
        payload.avatar || "avatar-1"
      );
      if (error || !room) {
        socket.emit("joinError", { message: error ?? "Unable to join." });
        return;
      }
      socket.join(room.code);
      socket.emit("roomJoined", { code: room.code });
      gm.broadcastState(room);
    }
  );

  socket.on("reconnectToRoom", (payload: { code: string }) => {
    const room = gm.reconnect(payload.code, socket.id);
    if (room) {
      socket.join(room.code);
      gm.broadcastState(room);
    }
  });

  socket.on("leaveRoom", (payload: { code: string }) => {
    const room = gm.handleDisconnect(socket.id);
    socket.leave(payload.code);
    if (room) gm.broadcastState(room);
  });

  socket.on("startGame", (payload: { code: string }) => {
    const room = gm.getRoom(payload.code);
    if (!room) return;
    if (room.hostId !== socket.id) return; // only host can start
    if (room.players.size < 2) {
      socket.emit("errorToast", { message: "Need at least 2 players." });
      return;
    }
    gm.startGame(room);
  });

  socket.on("chooseWord", (payload: { code: string; word: string }) => {
    const room = gm.getRoom(payload.code);
    if (!room) return;
    gm.chooseWord(room, socket.id, payload.word);
  });

  socket.on("guess", (payload: { code: string; text: string }) => {
    const room = gm.getRoom(payload.code);
    if (!room) return;
    if (isRateLimited(socket.id)) return;
    gm.handleGuess(room, socket.id, sanitizeText(payload.text));
  });

  // Drawing sync: server just re-broadcasts to everyone else in the room.
  // The drawer is the only client permitted to emit these (enforced by
  // checking currentDrawerId), preventing spoofed drawing from guessers.
  socket.on("drawing", (payload: { code: string; event: DrawEvent }) => {
    const room = gm.getRoom(payload.code);
    if (!room || room.game.currentDrawerId !== socket.id) return;
    socket.to(room.code).emit("drawing", payload.event);
  });

  socket.on("clearCanvas", (payload: { code: string }) => {
    const room = gm.getRoom(payload.code);
    if (!room || room.game.currentDrawerId !== socket.id) return;
    socket.to(room.code).emit("clearCanvas");
  });

  socket.on("disconnect", () => {
    const room = gm.handleDisconnect(socket.id);
    if (room) gm.broadcastState(room);
  });
}
