# Doodle Duel — Real-Time Multiplayer Drawing & Guessing Game

A Skribbl.io-inspired drawing/guessing game with a modern glassmorphism UI,
built as a working MVP with an architecture designed to grow into the full
premium feature set.

## Stack

- **Frontend**: React (Vite) + TypeScript + Tailwind CSS + Framer Motion +
  Zustand + Socket.IO client
- **Backend**: Node.js + Express + Socket.IO + TypeScript
- **State**: in-memory per-room (see "Roadmap" for MongoDB/Redis)

## Project structure

```
scribble-game/
├── server/
│   └── src/
│       ├── data/wordbank.ts        # categorized word bank, easy/medium/hard
│       ├── services/GameManager.ts # core game engine (rooms, turns, scoring)
│       ├── socket/registerHandlers.ts
│       ├── types/game.types.ts
│       ├── utils/                  # hint masking, scoring, room codes
│       └── index.ts                # Express + Socket.IO entry point
└── client/
    └── src/
        ├── components/             # Canvas, Chat, Leaderboard, overlays...
        ├── pages/                  # Landing, Lobby, GameRoom, Room (router)
        ├── store/gameStore.ts      # Zustand store synced from sockets
        ├── hooks/useSocketEvents.ts
        ├── services/socket.ts
        └── types/game.types.ts
```

## Running locally

**Backend**
```bash
cd server
npm install
cp .env.example .env
npm run dev        # http://localhost:4000
```

**Frontend** (separate terminal)
```bash
cd client
npm install
cp .env.example .env
npm run dev         # http://localhost:5173
```

Open the frontend URL in two+ browser tabs/windows to play a full game
locally — create a room in one tab, join with the room code in the others.

## How the game loop works

1. Host creates a room (rounds, difficulty, max players, public/private) →
   gets a 6-character room code.
2. Players join via code. Host starts once ≥2 players are in.
3. Each turn: the drawer gets 3 word choices and 15s to pick (auto-picked if
   time runs out). Everyone else sees "choosing..." with a countdown.
4. Drawing syncs stroke-by-stroke over Socket.IO; only the drawer's socket
   is authorized server-side to emit draw events.
5. Guessers type in the chat box; a correct guess is detected server-side,
   scores the guesser by speed (100/80/60/40/20 pts), and locks their input.
6. Letters reveal at 20%/40%/60% of the turn timer.
7. One full pass through all players = one round. After each round, a
   fullscreen scoreboard shows for 8s before the next round begins.
8. After the final round, the grand-winner podium screen shows final
   standings with "Play Again" / "Back to Home".

## What's implemented vs. deferred

**Implemented**: room creation/joining (public/private, max players),
lobby with host controls, real-time synced canvas (brush, eraser, size,
undo/redo, clear), word selection with no-repeat tracking, progressive
hints, speed-based scoring for guessers + proportional scoring for the
drawer, live leaderboard with floating score animations, round/game-end
overlays, reconnect-within-room support, disconnect handling with host
reassignment, server-side validation (drawer-only draw events, guess rate
limiting, input sanitization).

**Deferred** — the code is structured so each of these is additive, not a
rewrite:
- **Persistence**: swap `GameManager`'s in-memory `Map<string, Room>` for
  MongoDB-backed room/player documents; the service's public methods
  wouldn't need to change shape.
- **Redis**: would sit behind the same `GameManager` interface for
  multi-instance room state if you scale beyond one server process.
- **Docker**: add a `Dockerfile` per package + a root `docker-compose.yml`
  wiring server, client, and mongo/redis.
- **Word bank scale-up**: `wordbank.ts` is already organized as tagged
  category arrays merged into one list — going from ~250 to 2000+ words is
  purely additive (add category arrays like Anime, Space, Programming,
  Countries and `tag()` them in).
- **Achievements, sound effects, emoji reactions, spectator mode, avatar
  gallery expansion**: none of these touch the game engine's state
  machine — they're additive systems that listen to existing socket events
  (`correctGuess`, `roundSummary`, `gameFinished`, etc.) or add new
  lightweight ones (`reaction`, `spectateRoom`).

## Socket events reference

| Event | Direction | Purpose |
|---|---|---|
| `createRoom` / `roomCreated` | C→S / S→C | create a room |
| `joinRoom` / `roomJoined` / `joinError` | C→S / S→C | join a room |
| `reconnectToRoom` | C→S | rejoin after refresh/disconnect |
| `startGame` | C→S | host starts the game |
| `roomState` | S→C | full room snapshot (players, phase, timers) |
| `wordSelection` / `chooseWord` / `yourWord` | S→C / C→S / S→C | word pick flow |
| `turnStarted` / `hint` / `wordReveal` | S→C | turn lifecycle |
| `drawing` / `clearCanvas` | C→S→C | canvas sync (drawer-only, server-validated) |
| `guess` / `chatMessage` / `correctGuess` | C→S / S→C | guessing + chat |
| `drawerScored` / `roundSummary` / `gameFinished` | S→C | scoring + end states |
| `disconnect` / `playerDisconnected` (via `roomState`) | — | connection handling |

## Notes

This is a portfolio-quality working MVP, not a production deployment —
before shipping publicly you'd want: persistent storage, auth beyond guest
usernames, horizontal scaling (Redis adapter for Socket.IO), and load
testing on the canvas sync path with 12 concurrent drawers-turned-guessers.
