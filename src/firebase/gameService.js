import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebaseConfig";

const normalizeRoomId = (roomId) => roomId.trim().toUpperCase();

export function subscribeToGame({ roomId, onData, onError }) {
  const normalizedRoomId = normalizeRoomId(roomId);

  const gameReference = doc(db, "games", normalizedRoomId);

  return onSnapshot(
    gameReference,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData({
        id: snapshot.id,
        ...snapshot.data(),
      });
    },
    onError,
  );
}

export function subscribeToPrivateGameState({
  roomId,
  userId,
  onData,
  onError,
}) {
  const normalizedRoomId = normalizeRoomId(roomId);

  const privateReference = doc(
    db,
    "games",
    normalizedRoomId,
    "private",
    userId,
  );

  return onSnapshot(
    privateReference,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }

      onData({
        id: snapshot.id,
        ...snapshot.data(),
      });
    },
    onError,
  );
}

export async function createPrivateGameState({
  roomId,
  userId,
  boardStreamerIds,
  roundNumber = 1,
}) {
  const normalizedRoomId = normalizeRoomId(roomId);

  if (!Array.isArray(boardStreamerIds) || boardStreamerIds.length === 0) {
    throw new Error("game/invalid-streamer-board");
  }

  const privateReference = doc(
    db,
    "games",
    normalizedRoomId,
    "private",
    userId,
  );

  const privateSnapshot = await getDoc(privateReference);

  if (privateSnapshot.exists()) {
    const privateData = privateSnapshot.data();

    const privateRoundNumber = privateData.roundNumber || 1;

    if (privateRoundNumber === roundNumber) {
      return {
        id: privateSnapshot.id,
        ...privateData,
        roundNumber: privateRoundNumber,
      };
    }
  }

  const randomIndex = Math.floor(Math.random() * boardStreamerIds.length);

  const secretStreamerId = boardStreamerIds[randomIndex];

  const privateState = {
    userId,
    roundNumber,
    secretStreamerId,
    eliminatedStreamerIds: [],
    updatedAt: serverTimestamp(),
  };

  if (!privateSnapshot.exists()) {
    privateState.createdAt = serverTimestamp();
  }

  await setDoc(privateReference, privateState, {
    merge: true,
  });

  return privateState;
}

export async function toggleEliminatedStreamer({ roomId, userId, streamerId }) {
  const normalizedRoomId = normalizeRoomId(roomId);

  const privateReference = doc(
    db,
    "games",
    normalizedRoomId,
    "private",
    userId,
  );

  await runTransaction(db, async (transaction) => {
    const privateSnapshot = await transaction.get(privateReference);

    if (!privateSnapshot.exists()) {
      throw new Error("game/private-state-not-found");
    }

    const privateData = privateSnapshot.data();

    const eliminatedStreamerIds = privateData.eliminatedStreamerIds || [];

    const isAlreadyEliminated = eliminatedStreamerIds.includes(streamerId);

    const nextEliminatedStreamers = isAlreadyEliminated
      ? eliminatedStreamerIds.filter(
          (currentStreamerId) => currentStreamerId !== streamerId,
        )
      : [...eliminatedStreamerIds, streamerId];

    transaction.update(privateReference, {
      eliminatedStreamerIds: nextEliminatedStreamers,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function resetEliminatedStreamers({ roomId, userId }) {
  const normalizedRoomId = normalizeRoomId(roomId);

  const privateReference = doc(
    db,
    "games",
    normalizedRoomId,
    "private",
    userId,
  );

  await runTransaction(db, async (transaction) => {
    const privateSnapshot = await transaction.get(privateReference);

    if (!privateSnapshot.exists()) {
      throw new Error("game/private-state-not-found");
    }

    transaction.update(privateReference, {
      eliminatedStreamerIds: [],
      updatedAt: serverTimestamp(),
    });
  });
}

export function subscribeToQuestions({ roomId, onData, onError }) {
  const normalizedRoomId = normalizeRoomId(roomId);

  const questionsReference = collection(
    db,
    "games",
    normalizedRoomId,
    "questions",
  );

  const questionsQuery = query(questionsReference, orderBy("createdAt", "asc"));

  return onSnapshot(
    questionsQuery,
    (snapshot) => {
      const questions = snapshot.docs.map((questionDocument) => ({
        id: questionDocument.id,
        ...questionDocument.data(),
      }));

      onData(questions);
    },
    onError,
  );
}

export async function submitQuestion({ roomId, userId, text }) {
  const normalizedRoomId = normalizeRoomId(roomId);

  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error("game/empty-question");
  }

  if (normalizedText.length > 200) {
    throw new Error("game/question-too-long");
  }

  const gameReference = doc(db, "games", normalizedRoomId);

  const questionReference = doc(
    collection(db, "games", normalizedRoomId, "questions"),
  );

  await runTransaction(db, async (transaction) => {
    const gameSnapshot = await transaction.get(gameReference);

    if (!gameSnapshot.exists()) {
      throw new Error("game/not-found");
    }

    const gameData = gameSnapshot.data();

    if (gameData.status !== "playing") {
      throw new Error("game/not-playing");
    }

    if (!gameData.playerIds?.includes(userId)) {
      throw new Error("game/unauthorized");
    }

    if (gameData.currentTurn !== userId) {
      throw new Error("game/not-your-turn");
    }

    if (gameData.pendingQuestionId) {
      throw new Error("game/question-already-pending");
    }

    transaction.set(questionReference, {
      authorId: userId,
      text: normalizedText,

      answer: null,
      answeredBy: null,

      status: "pending",

      turnNumber: gameData.turnNumber || 1,
      roundNumber: gameData.roundNumber || 1,

      createdAt: serverTimestamp(),
      answeredAt: null,
    });

    transaction.update(gameReference, {
      pendingQuestionId: questionReference.id,
      updatedAt: serverTimestamp(),
    });
  });

  return questionReference.id;
}

export async function answerQuestion({ roomId, questionId, userId, answer }) {
  const allowedAnswers = ["yes", "no", "unknown"];

  if (!allowedAnswers.includes(answer)) {
    throw new Error("game/invalid-answer");
  }

  const normalizedRoomId = normalizeRoomId(roomId);

  const gameReference = doc(db, "games", normalizedRoomId);

  const questionReference = doc(
    db,
    "games",
    normalizedRoomId,
    "questions",
    questionId,
  );

  await runTransaction(db, async (transaction) => {
    const gameSnapshot = await transaction.get(gameReference);

    const questionSnapshot = await transaction.get(questionReference);

    if (!gameSnapshot.exists() || !questionSnapshot.exists()) {
      throw new Error("game/not-found");
    }

    const gameData = gameSnapshot.data();
    const questionData = questionSnapshot.data();

    if (gameData.status !== "playing") {
      throw new Error("game/not-playing");
    }

    if (!gameData.playerIds?.includes(userId)) {
      throw new Error("game/unauthorized");
    }

    if (questionData.status !== "pending") {
      throw new Error("game/question-already-answered");
    }

    if (questionData.authorId === userId) {
      throw new Error("game/cannot-answer-own-question");
    }

    const nextPlayerId =
      questionData.authorId === gameData.playerIds[0]
        ? gameData.playerIds[1]
        : gameData.playerIds[0];

    transaction.update(questionReference, {
      answer,
      answeredBy: userId,
      status: "answered",
      answeredAt: serverTimestamp(),
    });

    transaction.update(gameReference, {
      currentTurn: nextPlayerId,
      turnNumber: (gameData.turnNumber || 1) + 1,
      pendingQuestionId: null,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function submitFinalGuess({ roomId, userId, streamerId }) {
  const normalizedRoomId = normalizeRoomId(roomId);

  if (!streamerId) {
    throw new Error("game/invalid-guess");
  }

  const gameReference = doc(db, "games", normalizedRoomId);

  await runTransaction(db, async (transaction) => {
    const gameSnapshot = await transaction.get(gameReference);

    if (!gameSnapshot.exists()) {
      throw new Error("game/not-found");
    }

    const gameData = gameSnapshot.data();

    if (gameData.status !== "playing") {
      throw new Error("game/not-playing");
    }

    if (!gameData.playerIds?.includes(userId)) {
      throw new Error("game/unauthorized");
    }

    if (gameData.currentTurn !== userId) {
      throw new Error("game/not-your-turn");
    }

    if (gameData.pendingQuestionId) {
      throw new Error("game/question-pending");
    }

    if (gameData.pendingGuess) {
      throw new Error("game/guess-already-pending");
    }

    if (!gameData.boardStreamerIds?.includes(streamerId)) {
      throw new Error("game/streamer-not-on-board");
    }

    transaction.update(gameReference, {
      pendingGuess: {
        authorId: userId,
        streamerId,
        createdAt: new Date().toISOString(),
      },

      updatedAt: serverTimestamp(),
    });
  });
}

export async function resolveFinalGuess({ roomId, userId, isCorrect }) {
  const normalizedRoomId = normalizeRoomId(roomId);

  const gameReference = doc(db, "games", normalizedRoomId);

  await runTransaction(db, async (transaction) => {
    const gameSnapshot = await transaction.get(gameReference);

    if (!gameSnapshot.exists()) {
      throw new Error("game/not-found");
    }

    const gameData = gameSnapshot.data();
    const pendingGuess = gameData.pendingGuess;

    if (gameData.status !== "playing") {
      throw new Error("game/not-playing");
    }

    if (!pendingGuess) {
      throw new Error("game/no-pending-guess");
    }

    if (!gameData.playerIds?.includes(userId)) {
      throw new Error("game/unauthorized");
    }

    if (pendingGuess.authorId === userId) {
      throw new Error("game/cannot-resolve-own-guess");
    }

    const guessingPlayerId = pendingGuess.authorId;

    const opponentId = gameData.playerIds.find(
      (playerId) => playerId !== guessingPlayerId,
    );

    if (!opponentId) {
      throw new Error("game/opponent-not-found");
    }

    if (isCorrect) {
      transaction.update(gameReference, {
        status: "finished",

        winnerId: guessingPlayerId,
        loserId: opponentId,

        winningStreamerId: pendingGuess.streamerId,

        pendingGuess: null,
        rematchReadyIds: [],

        finishedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return;
    }

    const rejectedGuess = {
      playerId: guessingPlayerId,
      streamerId: pendingGuess.streamerId,
      turnNumber: gameData.turnNumber || 1,
      roundNumber: gameData.roundNumber || 1,
      resolvedAt: new Date().toISOString(),
    };

    const guessHistory = [...(gameData.guessHistory || []), rejectedGuess];

    transaction.update(gameReference, {
      currentTurn: opponentId,

      turnNumber: (gameData.turnNumber || 1) + 1,

      lastRejectedGuess: rejectedGuess,

      guessHistory,

      pendingGuess: null,

      updatedAt: serverTimestamp(),
    });
  });
}

export async function requestRematch({ roomId, userId }) {
  const normalizedRoomId = normalizeRoomId(roomId);

  const gameReference = doc(db, "games", normalizedRoomId);

  await runTransaction(db, async (transaction) => {
    const gameSnapshot = await transaction.get(gameReference);

    if (!gameSnapshot.exists()) {
      throw new Error("game/not-found");
    }

    const gameData = gameSnapshot.data();

    if (gameData.status !== "finished") {
      throw new Error("game/not-finished");
    }

    if (!gameData.playerIds?.includes(userId)) {
      throw new Error("game/unauthorized");
    }

    const currentReadyIds = gameData.rematchReadyIds || [];

    if (currentReadyIds.includes(userId)) {
      return;
    }

    const nextReadyIds = [...currentReadyIds, userId];

    transaction.update(gameReference, {
      rematchReadyIds: nextReadyIds,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function startRematch({ roomId, userId, boardStreamerIds }) {
  const normalizedRoomId = normalizeRoomId(roomId);

  if (!Array.isArray(boardStreamerIds) || boardStreamerIds.length < 2) {
    throw new Error("game/invalid-streamer-board");
  }

  const gameReference = doc(db, "games", normalizedRoomId);

  await runTransaction(db, async (transaction) => {
    const gameSnapshot = await transaction.get(gameReference);

    if (!gameSnapshot.exists()) {
      throw new Error("game/not-found");
    }

    const gameData = gameSnapshot.data();

    const playerIds = gameData.playerIds || [];

    const rematchReadyIds = gameData.rematchReadyIds || [];

    if (gameData.status !== "finished") {
      throw new Error("game/not-finished");
    }

    if (gameData.players?.host?.uid !== userId) {
      throw new Error("game/host-only");
    }

    if (playerIds.length !== 2) {
      throw new Error("game/invalid-players");
    }

    const bothPlayersAreReady = playerIds.every((playerId) =>
      rematchReadyIds.includes(playerId),
    );

    if (!bothPlayersAreReady) {
      throw new Error("game/rematch-not-ready");
    }

    const randomStartingPlayer =
      playerIds[Math.floor(Math.random() * playerIds.length)];

    transaction.update(gameReference, {
      boardStreamerIds,

      currentTurn: randomStartingPlayer,

      turnNumber: 1,

      roundNumber: (gameData.roundNumber || 1) + 1,

      pendingQuestionId: null,
      pendingGuess: null,

      guessHistory: [],
      lastRejectedGuess: null,
      rematchReadyIds: [],

      status: "playing",

      winnerId: null,
      loserId: null,
      winningStreamerId: null,

      finishedAt: null,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function abandonGame({ roomId, userId }) {
  const normalizedRoomId = normalizeRoomId(roomId);

  const gameReference = doc(db, "games", normalizedRoomId);

  await runTransaction(db, async (transaction) => {
    const gameSnapshot = await transaction.get(gameReference);

    if (!gameSnapshot.exists()) {
      throw new Error("game/not-found");
    }

    const gameData = gameSnapshot.data();

    if (gameData.status !== "playing") {
      throw new Error("game/not-playing");
    }

    if (!gameData.playerIds?.includes(userId)) {
      throw new Error("game/unauthorized");
    }

    const opponentId = gameData.playerIds.find(
      (playerId) => playerId !== userId,
    );

    if (!opponentId) {
      throw new Error("game/opponent-not-found");
    }

    transaction.update(gameReference, {
      status: "finished",

      winnerId: opponentId,
      loserId: userId,

      finishReason: "abandonment",
      abandonedBy: userId,

      winningStreamerId: null,

      pendingQuestionId: null,
      pendingGuess: null,

      rematchReadyIds: [],

      finishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
