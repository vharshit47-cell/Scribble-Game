import { Server } from "socket.io";
import { generateRoomCode } from "../utils/roomCode";
import { wordsForDifficulty } from "../data/wordbank";
import { maskWord, HINT_SCHEDULE } from "../utils/hint";
import {
  calculateGuesserPoints,
  drawerPoints,
  isCloseGuess,
} from "../utils/scoring";
import {
  Room,
  Player,
  RoomSettings,
  GameState,
  ChatMessage,
  PublicRoomState,
} from "../types/game.types";

const WORD_CHOICE_COUNT = 3;
const WORD_SELECTION_SECONDS = 15;

function freshGameState(totalRounds: number): GameState {
  return {
    phase: "lobby",
    currentRound: 0,
    totalRounds,
    drawOrder: [],
    turnIndex: -1,
    currentDrawerId: null,
    currentWord: null,
    wordChoices: null,
    maskedWord: null,
    usedWords: new Set(),
    turnStartedAt: null,
    turnEndsAt: null,
    correctGuesserOrder: [],
    hintsRevealedCount: 0,
    guessSpeedRatios: [],
  };
}

export class GameManager {
  private rooms = new Map<string, Room>();
  private turnTimers = new Map<string, NodeJS.Timeout>();
  private hintTimers = new Map<string, NodeJS.Timeout[]>();
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  // ---------- Room lifecycle ----------

  createRoom(
    hostId: string,
    hostUsername: string,
    avatar: string,
    settings: RoomSettings
  ): Room {
    let code = generateRoomCode();
    while (this.rooms.has(code)) code = generateRoomCode();

    const host: Player = {
      id: hostId,
      username: hostUsername,
      avatar,
      score: 0,
      isHost: true,
      connected: true,
      hasGuessedCorrectly: false,
      isDrawing: false,
    };

    const room: Room = {
      code,
      hostId,
      players: new Map([[hostId, host]]),
      settings,
      game: freshGameState(settings.rounds),
      chat: [],
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    return room;
  }

  getRoom(code: string): Room | undefined {
    return this.rooms.get(code.toUpperCase());
  }

  joinRoom(
    code: string,
    playerId: string,
    username: string,
    avatar: string
  ): { room?: Room; error?: string } {
    const room = this.getRoom(code);
    if (!room) return { error: "Room not found." };
    if (room.players.size >= room.settings.maxPlayers) {
      return { error: "Room is full." };
    }
    const usernameTaken = [...room.players.values()].some(
      (p) => p.username.toLowerCase() === username.toLowerCase() && p.connected
    );
    if (usernameTaken) return { error: "Username already taken in this room." };
    if (room.game.phase !== "lobby") {
      return { error: "Game already in progress." };
    }

    room.players.set(playerId, {
      id: playerId,
      username,
      avatar,
      score: 0,
      isHost: false,
      connected: true,
      hasGuessedCorrectly: false,
      isDrawing: false,
    });

    this.systemMessage(room, `${username} joined the room.`);
    return { room };
  }

  handleDisconnect(playerId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      const player = room.players.get(playerId);
      if (!player) continue;

      player.connected = false;
      this.systemMessage(room, `${player.username} disconnected.`);

      // Reassign host if needed.
      if (room.hostId === playerId) {
        const nextHost = [...room.players.values()].find(
          (p) => p.connected && p.id !== playerId
        );
        if (nextHost) {
          nextHost.isHost = true;
          room.hostId = nextHost.id;
        }
      }

      // If everyone's gone, clean up the room after a grace period.
      const anyoneLeft = [...room.players.values()].some((p) => p.connected);
      if (!anyoneLeft) {
        this.clearTimers(room.code);
        setTimeout(() => {
          const stillEmpty = [...(this.rooms.get(room.code)?.players.values() ?? [])].every(
            (p) => !p.connected
          );
          if (stillEmpty) this.rooms.delete(room.code);
        }, 60_000);
      } else if (player.isDrawing) {
        // Drawer left mid-turn: clear timers first, then skip to next turn.
        this.clearTimers(room.code);
        this.advanceTurn(room);
      }

      return room;
    }
    return undefined;
  }

  reconnect(roomCode: string, playerId: string, username?: string): Room | undefined {
    const room = this.getRoom(roomCode);
    if (!room) return undefined;

    let player = room.players.get(playerId);
    if (!player && username) {
      for (const [oldId, p] of room.players.entries()) {
        if (!p.connected && p.username.toLowerCase() === username.toLowerCase()) {
          room.players.delete(oldId);
          p.id = playerId;
          room.players.set(playerId, p);
          player = p;
          if (room.hostId === oldId) room.hostId = playerId;
          if (room.game.currentDrawerId === oldId) room.game.currentDrawerId = playerId;
          const idx = room.game.drawOrder.indexOf(oldId);
          if (idx !== -1) room.game.drawOrder[idx] = playerId;
          break;
        }
      }
    }

    if (player) {
      player.connected = true;
      this.systemMessage(room, `${player.username} reconnected.`);
      return room;
    }
    return undefined;
  }

  // ---------- Game flow ----------

  startGame(room: Room): void {
    const connectedPlayers = [...room.players.values()].filter(
      (p) => p.connected
    );
    room.game = freshGameState(room.settings.rounds);
    room.game.drawOrder = connectedPlayers.map((p) => p.id);
    room.game.phase = "word-selection";
    room.game.currentRound = 1;
    room.game.turnIndex = 0;
    this.beginTurn(room);
  }

  private beginTurn(room: Room): void {
    const game = room.game;
    const drawerId = game.drawOrder[game.turnIndex];
    game.currentDrawerId = drawerId;
    game.correctGuesserOrder = [];
    game.hintsRevealedCount = 0;
    game.guessSpeedRatios = [];

    for (const p of room.players.values()) {
      p.hasGuessedCorrectly = false;
      p.isDrawing = p.id === drawerId;
    }

    const choices = this.pickWordChoices(room);
    game.wordChoices = choices;
    game.phase = "word-selection";
    game.currentWord = null;
    game.maskedWord = null;
    game.turnStartedAt = Date.now();
    game.turnEndsAt = Date.now() + WORD_SELECTION_SECONDS * 1000;

    // Clear visual canvas on all clients for new turn
    this.io.to(room.code).emit("clearCanvas");
    this.io.to(room.code).emit("wordSelection", {
      drawerId,
      choices,
      selectionEndsAt: game.turnEndsAt,
    });
    this.broadcastState(room);

    this.clearTimers(room.code);
    const timer = setTimeout(() => {
      // Auto-pick if drawer didn't choose in time.
      if (room.game.phase === "word-selection") {
        const auto = choices[Math.floor(Math.random() * choices.length)];
        this.chooseWord(room, drawerId, auto);
      }
    }, WORD_SELECTION_SECONDS * 1000);
    this.turnTimers.set(room.code, timer);
  }

  private pickWordChoices(room: Room): string[] {
    const pool = wordsForDifficulty(room.settings.difficulty).filter(
      (w) => !room.game.usedWords.has(w)
    );

    const source =
      pool.length >= WORD_CHOICE_COUNT
        ? pool
        : wordsForDifficulty(room.settings.difficulty);
    if (pool.length < WORD_CHOICE_COUNT) room.game.usedWords.clear();

    const shuffled = [...source].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, WORD_CHOICE_COUNT);
  }

  chooseWord(room: Room, drawerId: string, word: string): void {
    if (room.game.phase !== "word-selection") return;
    if (room.game.currentDrawerId !== drawerId) return;
    if (!room.game.wordChoices?.includes(word)) return;

    this.clearTimers(room.code);

    const game = room.game;
    game.currentWord = word;
    game.usedWords.add(word);
    game.wordChoices = null;
    game.phase = "drawing";
    game.maskedWord = maskWord(word, 0);
    game.turnStartedAt = Date.now();
    game.turnEndsAt =
      Date.now() + room.settings.turnDurationSeconds * 1000;

    this.io.to(room.code).emit("turnStarted", {
      drawerId,
      maskedWord: game.maskedWord,
      turnEndsAt: game.turnEndsAt,
      wordLength: word.replace(/ /g, "").length,
    });
    // Only the drawer learns the actual word.
    this.io.to(drawerId).emit("yourWord", { word });
    this.broadcastState(room);

    this.scheduleHints(room);

    const timer = setTimeout(() => {
      this.endTurn(room, "timeout");
    }, room.settings.turnDurationSeconds * 1000);
    this.turnTimers.set(room.code, timer);
  }

  private scheduleHints(room: Room): void {
    const timers: NodeJS.Timeout[] = [];
    const durationMs = room.settings.turnDurationSeconds * 1000;
    for (const pct of HINT_SCHEDULE) {
      const timer = setTimeout(() => {
        if (room.game.phase !== "drawing" || !room.game.currentWord) return;
        room.game.hintsRevealedCount += 1;
        room.game.maskedWord = maskWord(room.game.currentWord, pct);
        this.io.to(room.code).emit("hint", { maskedWord: room.game.maskedWord });
      }, durationMs * pct);
      timers.push(timer);
    }
    this.hintTimers.set(room.code, timers);
  }

  handleGuess(room: Room, playerId: string, text: string): void {
    const player = room.players.get(playerId);
    const game = room.game;
    if (!player || game.phase !== "drawing") return;
    if (player.isDrawing || player.hasGuessedCorrectly) return;

    const isCorrect =
      !!game.currentWord &&
      text.trim().toLowerCase() === game.currentWord.trim().toLowerCase();

    if (isCorrect) {
      player.hasGuessedCorrectly = true;
      game.correctGuesserOrder.push(playerId);
      const orderIndex = game.correctGuesserOrder.length - 1;

      // Calculate speed ratio (1.0 = immediate guess, 0.0 = last second)
      const now = Date.now();
      const totalDuration = room.settings.turnDurationSeconds * 1000;
      const timeRemaining = game.turnEndsAt ? Math.max(0, game.turnEndsAt - now) : totalDuration / 2;
      const timeRemainingRatio = Math.min(1, Math.max(0, timeRemaining / totalDuration));
      game.guessSpeedRatios.push(timeRemainingRatio);

      const points = calculateGuesserPoints({
        timeRemainingRatio,
        orderIndex,
        hintsRevealedCount: game.hintsRevealedCount,
      });
      player.score += points;

      this.pushChat(room, {
        id: `${Date.now()}-${playerId}`,
        type: "correct-guess",
        playerId,
        username: player.username,
        text: "guessed the word!",
        timestamp: Date.now(),
      });
      this.io.to(room.code).emit("correctGuess", {
        playerId,
        username: player.username,
        points,
      });
      this.broadcastState(room);

      const guessers = [...room.players.values()].filter((p) => !p.isDrawing);
      const allGuessed = guessers.every((p) => p.hasGuessedCorrectly);
      if (allGuessed) this.endTurn(room, "all-guessed");
    } else {
      this.pushChat(room, {
        id: `${Date.now()}-${playerId}`,
        type: "chat",
        playerId,
        username: player.username,
        text,
        timestamp: Date.now(),
      });
      this.io.to(room.code).emit("chatMessage", this.lastMessage(room));

      // Close guess check & feedback
      if (game.currentWord && isCloseGuess(text, game.currentWord)) {
        this.systemMessage(room, `${player.username} is very close!`);
        this.io.to(playerId).emit("closeGuess", {
          message: `"${text}" is very close to the secret word!`,
        });
      }
    }
  }

  private endTurn(room: Room, _reason: "timeout" | "all-guessed"): void {
    this.clearTimers(room.code);
    const game = room.game;
    const drawer = game.currentDrawerId
      ? room.players.get(game.currentDrawerId)
      : undefined;

    const guessers = [...room.players.values()].filter(
      (p) => p.id !== game.currentDrawerId
    );
    const correctCount = game.correctGuesserOrder.length;
    if (drawer) {
      const avgSpeedRatio =
        game.guessSpeedRatios.length > 0
          ? game.guessSpeedRatios.reduce((a, b) => a + b, 0) / game.guessSpeedRatios.length
          : 0.5;
      const points = drawerPoints(correctCount, guessers.length, avgSpeedRatio);
      drawer.score += points;
      this.io.to(room.code).emit("drawerScored", {
        playerId: drawer.id,
        points,
      });
    }

    if (game.currentWord) {
      this.io.to(room.code).emit("wordReveal", { word: game.currentWord });
      this.systemMessage(room, `The word was: ${game.currentWord}`);
    }

    this.advanceTurn(room);
  }

  private advanceTurn(room: Room): void {
    const game = room.game;
    game.turnIndex += 1;

    if (game.turnIndex >= game.drawOrder.length) {
      // Round complete.
      this.emitRoundSummary(room);
      if (game.currentRound >= game.totalRounds) {
        this.endGame(room);
        return;
      }
      game.currentRound += 1;
      game.turnIndex = 0;
      // Re-sync draw order to currently connected players for the new round.
      game.drawOrder = [...room.players.values()]
        .filter((p) => p.connected)
        .map((p) => p.id);

      room.game.phase = "round-end";
      this.broadcastState(room);
      setTimeout(() => this.beginTurn(room), 8_000); // matches fullscreen scoreboard duration
      return;
    }

    // Skip disconnected players.
    while (
      game.turnIndex < game.drawOrder.length &&
      !room.players.get(game.drawOrder[game.turnIndex])?.connected
    ) {
      game.turnIndex += 1;
    }
    if (game.turnIndex >= game.drawOrder.length) {
      this.advanceTurn(room); // triggers round-complete branch above
      return;
    }

    this.beginTurn(room);
  }

  private emitRoundSummary(room: Room): void {
    const ranked = [...room.players.values()]
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({
        playerId: p.id,
        username: p.username,
        score: p.score,
        rank: i + 1,
      }));
    this.io.to(room.code).emit("roundSummary", {
      round: room.game.currentRound,
      totalRounds: room.game.totalRounds,
      standings: ranked,
    });
  }

  private endGame(room: Room): void {
    room.game.phase = "game-end";
    const ranked = [...room.players.values()]
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({
        playerId: p.id,
        username: p.username,
        score: p.score,
        rank: i + 1,
      }));
    this.io.to(room.code).emit("gameFinished", { standings: ranked });
    this.broadcastState(room);
    this.clearTimers(room.code);
  }

  // ---------- Chat / drawing passthrough ----------

  systemMessage(room: Room, text: string): void {
    const msg: ChatMessage = {
      id: `${Date.now()}-sys`,
      type: "system",
      text,
      timestamp: Date.now(),
    };
    this.pushChat(room, msg);
    this.io.to(room.code).emit("chatMessage", msg);
  }

  private pushChat(room: Room, msg: ChatMessage): void {
    room.chat.push(msg);
    if (room.chat.length > 200) room.chat.shift();
  }

  private lastMessage(room: Room): ChatMessage {
    return room.chat[room.chat.length - 1];
  }

  // ---------- Serialization ----------

  toPublicState(room: Room): PublicRoomState {
    return {
      code: room.code,
      hostId: room.hostId,
      players: [...room.players.values()],
      settings: room.settings,
      phase: room.game.phase,
      currentRound: room.game.currentRound,
      totalRounds: room.game.totalRounds,
      currentDrawerId: room.game.currentDrawerId,
      maskedWord: room.game.maskedWord,
      turnEndsAt: room.game.turnEndsAt,
    };
  }

  broadcastState(room: Room): void {
    this.io.to(room.code).emit("roomState", this.toPublicState(room));
  }

  private clearTimers(roomCode: string): void {
    const t = this.turnTimers.get(roomCode);
    if (t) clearTimeout(t);
    this.turnTimers.delete(roomCode);

    const hints = this.hintTimers.get(roomCode);
    hints?.forEach(clearTimeout);
    this.hintTimers.delete(roomCode);
  }
}
