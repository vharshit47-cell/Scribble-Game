import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { GameManager } from "./services/GameManager";
import { registerHandlers } from "./socket/registerHandlers";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_ORIGIN, methods: ["GET", "POST"] },
});

const gameManager = new GameManager(io);

io.on("connection", (socket) => {
  registerHandlers(io, socket, gameManager);
});

httpServer.listen(PORT, () => {
  console.log(`Scribble server listening on :${PORT}`);
});
