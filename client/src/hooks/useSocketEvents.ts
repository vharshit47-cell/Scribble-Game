import { useEffect } from "react";
import { socket } from "../services/socket";
import { useGameStore } from "../store/gameStore";
import { PublicRoomState, ChatMessage } from "../types/game.types";

/** Mounts once at app root; keeps the store in sync with the server. */
export function useSocketEvents() {
  const {
    setSelf,
    setRoom,
    addChat,
    setWordSelection,
    setYourWord,
    setMaskedWord,
    setWordReveal,
    setRoundSummary,
    setFinalStandings,
    pushScoreFloat,
    setJoinError,
    setToast,
  } = useGameStore();

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onConnect = () => setSelf(socket.id ?? null);

    const onRoomState = (state: PublicRoomState) => setRoom(state);

    const onChat = (msg: ChatMessage) => addChat(msg);

    const onWordSelection = (payload: {
      choices: string[];
      selectionEndsAt: number;
    }) => setWordSelection(payload.choices, payload.selectionEndsAt);

    const onYourWord = (payload: { word: string }) =>
      setYourWord(payload.word);

    const onTurnStarted = () => setWordSelection(null, null);

    const onHint = (payload: { maskedWord: string }) =>
      setMaskedWord(payload.maskedWord);

    const onWordReveal = (payload: { word: string }) =>
      setWordReveal(payload.word);

    const onCorrectGuess = (payload: { playerId: string; points: number }) =>
      pushScoreFloat(payload.playerId, payload.points);

    const onDrawerScored = (payload: { playerId: string; points: number }) =>
      pushScoreFloat(payload.playerId, payload.points);

    const onRoundSummary = (payload: any) => setRoundSummary(payload);

    const onGameFinished = (payload: { standings: any[] }) =>
      setFinalStandings(payload.standings);

    const onJoinError = (payload: { message: string }) =>
      setJoinError(payload.message);

    const onErrorToast = (payload: { message: string }) =>
      setToast(payload.message);

    socket.on("connect", onConnect);
    socket.on("roomState", onRoomState);
    socket.on("chatMessage", onChat);
    socket.on("wordSelection", onWordSelection);
    socket.on("yourWord", onYourWord);
    socket.on("turnStarted", onTurnStarted);
    socket.on("hint", onHint);
    socket.on("wordReveal", onWordReveal);
    socket.on("correctGuess", onCorrectGuess);
    socket.on("drawerScored", onDrawerScored);
    socket.on("roundSummary", onRoundSummary);
    socket.on("gameFinished", onGameFinished);
    socket.on("joinError", onJoinError);
    socket.on("errorToast", onErrorToast);

    if (socket.id) setSelf(socket.id);

    return () => {
      socket.off("connect", onConnect);
      socket.off("roomState", onRoomState);
      socket.off("chatMessage", onChat);
      socket.off("wordSelection", onWordSelection);
      socket.off("yourWord", onYourWord);
      socket.off("turnStarted", onTurnStarted);
      socket.off("hint", onHint);
      socket.off("wordReveal", onWordReveal);
      socket.off("correctGuess", onCorrectGuess);
      socket.off("drawerScored", onDrawerScored);
      socket.off("roundSummary", onRoundSummary);
      socket.off("gameFinished", onGameFinished);
      socket.off("joinError", onJoinError);
      socket.off("errorToast", onErrorToast);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
