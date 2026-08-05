import { create } from "zustand";
import {
  PublicRoomState,
  ChatMessage,
  RoundStanding,
} from "../types/game.types";

interface ScoreFloat {
  id: string;
  playerId: string;
  points: number;
}

interface GameStore {
  selfId: string | null;
  username: string;
  avatar: string;
  room: PublicRoomState | null;
  chat: ChatMessage[];
  wordChoices: string[] | null;
  selectionEndsAt: number | null;
  yourWord: string | null;
  lastRevealedWord: string | null;
  roundSummary: { round: number; totalRounds: number; standings: RoundStanding[] } | null;
  finalStandings: RoundStanding[] | null;
  scoreFloats: ScoreFloat[];
  joinError: string | null;
  toast: string | null;

  setSelf: (id: string | null) => void;
  setIdentity: (username: string, avatar: string) => void;
  setRoom: (room: PublicRoomState) => void;
  addChat: (msg: ChatMessage) => void;
  setWordSelection: (choices: string[] | null, endsAt: number | null) => void;
  setYourWord: (word: string | null) => void;
  setMaskedWord: (masked: string) => void;
  setWordReveal: (word: string) => void;
  setRoundSummary: (summary: GameStore["roundSummary"]) => void;
  setFinalStandings: (standings: RoundStanding[]) => void;
  pushScoreFloat: (playerId: string, points: number) => void;
  clearScoreFloat: (id: string) => void;
  setJoinError: (err: string | null) => void;
  setToast: (msg: string | null) => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  selfId: null,
  username: "",
  avatar: "avatar-1",
  room: null,
  chat: [],
  wordChoices: null,
  selectionEndsAt: null,
  yourWord: null,
  lastRevealedWord: null,
  roundSummary: null,
  finalStandings: null,
  scoreFloats: [],
  joinError: null,
  toast: null,

  setSelf: (id) => set({ selfId: id }),
  setIdentity: (username, avatar) => set({ username, avatar }),
  setRoom: (room) =>
    set((s) => ({
      room,
      // Clear transient overlays once we move past the phases they belong to.
      wordChoices: room.phase === "word-selection" ? s.wordChoices : null,
      roundSummary: room.phase === "round-end" ? s.roundSummary : s.roundSummary,
    })),
  addChat: (msg) => set((s) => ({ chat: [...s.chat, msg].slice(-200) })),
  setWordSelection: (choices, endsAt) =>
    set({ wordChoices: choices, selectionEndsAt: endsAt, yourWord: null }),
  setYourWord: (word) => set({ yourWord: word, wordChoices: null }),
  setMaskedWord: (masked) =>
    set((s) => (s.room ? { room: { ...s.room, maskedWord: masked } } : {})),
  setWordReveal: (word) => set({ lastRevealedWord: word }),
  setRoundSummary: (summary) => set({ roundSummary: summary }),
  setFinalStandings: (standings) => set({ finalStandings: standings }),
  pushScoreFloat: (playerId, points) =>
    set((s) => ({
      scoreFloats: [
        ...s.scoreFloats,
        { id: `${Date.now()}-${Math.random()}`, playerId, points },
      ],
    })),
  clearScoreFloat: (id) =>
    set((s) => ({ scoreFloats: s.scoreFloats.filter((f) => f.id !== id) })),
  setJoinError: (err) => set({ joinError: err }),
  setToast: (msg) => set({ toast: msg }),
  reset: () =>
    set({
      room: null,
      chat: [],
      wordChoices: null,
      selectionEndsAt: null,
      yourWord: null,
      lastRevealedWord: null,
      roundSummary: null,
      finalStandings: null,
      scoreFloats: [],
      joinError: null,
      toast: null,
    }),
}));
