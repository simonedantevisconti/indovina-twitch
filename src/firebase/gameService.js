import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import { db } from "./firebaseConfig";

const normalizeRoomId = (roomId) =>
  roomId.trim().toUpperCase();

export function subscribeToGame({
  roomId,
  onData,
  onError,
}) {
  const normalizedRoomId =
    normalizeRoomId(roomId);

  const gameReference = doc(
    db,
    "games",
    normalizedRoomId,
  );

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
  const normalizedRoomId =
    normalizeRoomId(roomId);

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
}) {
  const normalizedRoomId =
    normalizeRoomId(roomId);

  if (
    !Array.isArray(boardStreamerIds) ||
    boardStreamerIds.length === 0
  ) {
    throw new Error(
      "game/invalid-streamer-board",
    );
  }

  const privateReference = doc(
    db,
    "games",
    normalizedRoomId,
    "private",
    userId,
  );

  const privateSnapshot =
    await getDoc(privateReference);

  /*
   * Evita di cambiare personaggio segreto
   * ricaricando la pagina.
   */
  if (privateSnapshot.exists()) {
    return {
      id: privateSnapshot.id,
      ...privateSnapshot.data(),
    };
  }

  const randomIndex = Math.floor(
    Math.random() * boardStreamerIds.length,
  );

  const secretStreamerId =
    boardStreamerIds[randomIndex];

  const privateState = {
    userId,
    secretStreamerId,
    eliminatedStreamerIds: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(
    privateReference,
    privateState,
  );

  return privateState;
}

export async function toggleEliminatedStreamer({
  roomId,
  userId,
  streamerId,
}) {
  const normalizedRoomId =
    normalizeRoomId(roomId);

  const privateReference = doc(
    db,
    "games",
    normalizedRoomId,
    "private",
    userId,
  );

  await runTransaction(
    db,
    async (transaction) => {
      const privateSnapshot =
        await transaction.get(
          privateReference,
        );

      if (!privateSnapshot.exists()) {
        throw new Error(
          "game/private-state-not-found",
        );
      }

      const privateData =
        privateSnapshot.data();

      const eliminatedStreamerIds =
        privateData.eliminatedStreamerIds ||
        [];

      const isAlreadyEliminated =
        eliminatedStreamerIds.includes(
          streamerId,
        );

      const nextEliminatedStreamers =
        isAlreadyEliminated
          ? eliminatedStreamerIds.filter(
              (currentStreamerId) =>
                currentStreamerId !==
                streamerId,
            )
          : [
              ...eliminatedStreamerIds,
              streamerId,
            ];

      transaction.update(
        privateReference,
        {
          eliminatedStreamerIds:
            nextEliminatedStreamers,
          updatedAt: serverTimestamp(),
        },
      );
    },
  );
}

export async function resetEliminatedStreamers({
  roomId,
  userId,
}) {
  const normalizedRoomId =
    normalizeRoomId(roomId);

  const privateReference = doc(
    db,
    "games",
    normalizedRoomId,
    "private",
    userId,
  );

  await runTransaction(
    db,
    async (transaction) => {
      const privateSnapshot =
        await transaction.get(
          privateReference,
        );

      if (!privateSnapshot.exists()) {
        throw new Error(
          "game/private-state-not-found",
        );
      }

      transaction.update(
        privateReference,
        {
          eliminatedStreamerIds: [],
          updatedAt: serverTimestamp(),
        },
      );
    },
  );
}