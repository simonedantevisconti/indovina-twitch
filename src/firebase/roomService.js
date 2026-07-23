import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "./firebaseConfig";
import generateRoomCode from "../utils/generateRoomCode";

const roomsCollection = collection(db, "rooms");

const normalizeRoomCode = (roomCode) => roomCode.trim().toUpperCase();

const getPlayerData = (user) => ({
  uid: user.uid,
  username: user.displayName || user.email?.split("@")[0] || "Giocatore",
  photoURL: user.photoURL || "",
});

async function findRoomByCode(roomCode) {
  const normalizedCode = normalizeRoomCode(roomCode);

  const roomQuery = query(
    roomsCollection,
    where("roomCode", "==", normalizedCode),
    limit(1),
  );

  const snapshot = await getDocs(roomQuery);

  if (snapshot.empty) {
    return null;
  }

  const roomDocument = snapshot.docs[0];

  return {
    id: roomDocument.id,
    ...roomDocument.data(),
  };
}

async function generateUniqueRoomCode() {
  const maximumAttempts = 10;

  for (let attempt = 0; attempt < maximumAttempts; attempt += 1) {
    const roomCode = generateRoomCode();
    const existingRoom = await findRoomByCode(roomCode);

    if (!existingRoom) {
      return roomCode;
    }
  }

  throw new Error("room/code-generation-failed");
}

export async function createRoom({ user, type = "private" }) {
  if (!user) {
    throw new Error("room/auth-required");
  }

  if (!["private", "public"].includes(type)) {
    throw new Error("room/invalid-type");
  }

  const roomReference = doc(roomsCollection);
  const roomCode = await generateUniqueRoomCode();

  const host = getPlayerData(user);

  const roomData = {
    roomCode,
    type,
    status: "waiting",

    hostId: user.uid,
    guestId: null,

    players: {
      host,
      guest: null,
    },

    playerIds: [user.uid],
    readyPlayers: [],

    maxPlayers: 2,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),

    startedAt: null,
    finishedAt: null,
    gameId: null,
  };

  await setDoc(roomReference, roomData);

  return {
    id: roomReference.id,
    ...roomData,
  };
}

export async function joinRoomByCode({ roomCode, user }) {
  if (!user) {
    throw new Error("room/auth-required");
  }

  const room = await findRoomByCode(roomCode);

  if (!room) {
    throw new Error("room/not-found");
  }

  return joinRoomById({
    roomId: room.id,
    user,
  });
}

export async function joinRoomById({ roomId, user }) {
  if (!user) {
    throw new Error("room/auth-required");
  }

  const roomReference = doc(db, "rooms", roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnapshot = await transaction.get(roomReference);

    if (!roomSnapshot.exists()) {
      throw new Error("room/not-found");
    }

    const roomData = roomSnapshot.data();

    if (roomData.status !== "waiting") {
      throw new Error("room/not-available");
    }

    const playerIds = roomData.playerIds || [];

    if (playerIds.includes(user.uid)) {
      return;
    }

    if (playerIds.length >= roomData.maxPlayers) {
      throw new Error("room/full");
    }

    if (roomData.guestId) {
      throw new Error("room/full");
    }

    const guest = getPlayerData(user);

    transaction.update(roomReference, {
      guestId: user.uid,
      "players.guest": guest,
      playerIds: [...playerIds, user.uid],
      updatedAt: serverTimestamp(),
    });
  });

  return roomId;
}

export function subscribeToRoom({ roomId, onData, onError }) {
  const roomReference = doc(db, "rooms", roomId);

  return onSnapshot(
    roomReference,
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

export function subscribeToPublicRooms({ onData, onError }) {
  const publicRoomsQuery = query(
    roomsCollection,
    where("type", "==", "public"),
    where("status", "==", "waiting"),
  );

  return onSnapshot(
    publicRoomsQuery,
    (snapshot) => {
      const rooms = snapshot.docs
        .map((roomDocument) => ({
          id: roomDocument.id,
          ...roomDocument.data(),
        }))
        .filter(
          (room) =>
            Array.isArray(room.playerIds) &&
            room.playerIds.length < room.maxPlayers,
        );

      onData(rooms);
    },
    onError,
  );
}

export async function togglePlayerReady({ roomId, userId }) {
  const roomReference = doc(db, "rooms", roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnapshot = await transaction.get(roomReference);

    if (!roomSnapshot.exists()) {
      throw new Error("room/not-found");
    }

    const roomData = roomSnapshot.data();
    const playerIds = roomData.playerIds || [];
    const readyPlayers = roomData.readyPlayers || [];

    if (!playerIds.includes(userId)) {
      throw new Error("room/unauthorized");
    }

    const isReady = readyPlayers.includes(userId);

    const nextReadyPlayers = isReady
      ? readyPlayers.filter((currentUserId) => currentUserId !== userId)
      : [...readyPlayers, userId];

    transaction.update(roomReference, {
      readyPlayers: nextReadyPlayers,
      updatedAt: serverTimestamp(),
    });
  });
}

export async function leaveRoom({ roomId, userId }) {
  const roomReference = doc(db, "rooms", roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnapshot = await transaction.get(roomReference);

    if (!roomSnapshot.exists()) {
      return;
    }

    const roomData = roomSnapshot.data();
    const playerIds = roomData.playerIds || [];
    const readyPlayers = roomData.readyPlayers || [];

    if (!playerIds.includes(userId)) {
      return;
    }

    if (roomData.hostId === userId) {
      transaction.delete(roomReference);
      return;
    }

    if (roomData.guestId === userId) {
      transaction.update(roomReference, {
        guestId: null,
        "players.guest": null,
        playerIds: playerIds.filter(
          (currentUserId) => currentUserId !== userId,
        ),
        readyPlayers: readyPlayers.filter(
          (currentUserId) => currentUserId !== userId,
        ),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

export async function startRoom({ roomId, userId }) {
  const roomReference = doc(db, "rooms", roomId);

  await runTransaction(db, async (transaction) => {
    const roomSnapshot = await transaction.get(roomReference);

    if (!roomSnapshot.exists()) {
      throw new Error("room/not-found");
    }

    const roomData = roomSnapshot.data();
    const playerIds = roomData.playerIds || [];
    const readyPlayers = roomData.readyPlayers || [];

    if (roomData.hostId !== userId) {
      throw new Error("room/host-only");
    }

    if (roomData.status !== "waiting") {
      throw new Error("room/not-available");
    }

    if (playerIds.length !== 2) {
      throw new Error("room/not-enough-players");
    }

    const everyPlayerIsReady = playerIds.every((playerId) =>
      readyPlayers.includes(playerId),
    );

    if (!everyPlayerIsReady) {
      throw new Error("room/players-not-ready");
    }

    transaction.update(roomReference, {
      status: "starting",
      startedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

export async function deleteRoom(roomId) {
  await deleteDoc(doc(db, "rooms", roomId));
}

export async function updateRoomStatus({ roomId, status }) {
  await updateDoc(doc(db, "rooms", roomId), {
    status,
    updatedAt: serverTimestamp(),
  });
}
