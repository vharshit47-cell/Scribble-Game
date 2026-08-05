export type Difficulty = "easy" | "medium" | "hard";

export type GamePhase =
  | "lobby"
  | "word-selection"
  | "drawing"
  | "round-end"
  | "game-end";

export interface Player {
  id: string; // socket id
  username: string;
  avatar: string;
  score: number;
  isHost: boolean;
  connected: boolean;
  hasGuessedCorrectly: boolean;
  isDrawing: boolean;
}

export interface ChatMessage {
  id: string;
  type: "chat" | "system" | "correct-guess";
  playerId?: string;
  username?: string;
  text: string;
  timestamp: number;
}

export interface DrawEvent {
  type: "start" | "draw" | "end" | "clear" | "undo" | "redo" | "fill" | "replay";
  x?: number;
  y?: number;
  color?: string;
  size?: number;
  tool?: "brush" | "eraser" | "fill";
  strokeId?: string;
  /** Full stroke history, used only for "replay" events (undo/redo resync). */
  strokes?: Stroke[];
}

export interface Stroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  size: number;
  tool: "brush" | "eraser";
}

export interface RoomSettings {
  rounds: 5 | 10 | 15 | 20;
  difficulty: Difficulty;
  maxPlayers: number;
  isPrivate: boolean;
  turnDurationSeconds: number; // default 80
}

export interface RoundSummaryEntry {
  playerId: string;
  username: string;
  score: number;
  scoreDelta: number;
  correctGuesses: number;
  rank: number;
}

export interface GameState {
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  drawOrder: string[]; // player ids, one full pass = one round
  turnIndex: number; // index into drawOrder for current turn
  currentDrawerId: string | null;
  currentWord: string | null;
  wordChoices: string[] | null;
  maskedWord: string | null;
  usedWords: Set<string>;
  turnStartedAt: number | null;
  turnEndsAt: number | null;
  correctGuesserOrder: string[]; // order in which players guessed correctly this turn
}

export interface Room {
  code: string;
  hostId: string;
  players: Map<string, Player>;
  settings: RoomSettings;
  game: GameState;
  chat: ChatMessage[];
  createdAt: number;
}

// ---- Serialized (client-facing) shapes ----

export interface PublicPlayer extends Omit<Player, never> {}

export interface PublicRoomState {
  code: string;
  hostId: string;
  players: PublicPlayer[];
  settings: RoomSettings;
  phase: GamePhase;
  currentRound: number;
  totalRounds: number;
  currentDrawerId: string | null;
  maskedWord: string | null;
  turnEndsAt: number | null;
}
