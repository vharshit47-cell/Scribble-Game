export type Difficulty = "easy" | "medium" | "hard";
export type GamePhase =
  | "lobby"
  | "word-selection"
  | "drawing"
  | "round-end"
  | "game-end";

export interface Player {
  id: string;
  username: string;
  avatar: string;
  score: number;
  isHost: boolean;
  connected: boolean;
  hasGuessedCorrectly: boolean;
  isDrawing: boolean;
}

export interface RoomSettings {
  rounds: 5 | 10 | 15 | 20;
  difficulty: Difficulty;
  maxPlayers: number;
  isPrivate: boolean;
  turnDurationSeconds: number;
}

export interface PublicRoomState {
  code: string;
  hostId: string;
  players: Player[];
  settings: RoomSettings;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  maskedWord: string | null;
  turnEndsAt: number | null;
}

export interface ChatMessage {
  id: string;
  type: "chat" | "system" | "correct-guess";
  playerId?: string;
  username?: string;
  text: string;
  timestamp: number;
}

export interface Stroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  size: number;
  tool: "brush" | "eraser";
}

export interface DrawEvent {
  type: "start" | "draw" | "end" | "clear" | "undo" | "redo" | "fill" | "replay";
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  tool?: "brush" | "eraser" | "fill";
  strokeId?: string;
  strokes?: Stroke[];
}

export interface RoundStanding {
  playerId: string;
  username: string;
  score: number;
  rank: number;
}
