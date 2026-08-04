import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";

import { db } from "./firebaseConfig";

const normalizeRoomId = (roomId) => roomId.trim().toUpperCase();

export async function updatePlayerPresence({
  roomId,
  userId,
  status = "online",
}) {
  const normalizedRoomId = normalizeRoomId(roomId);

  const presenceReference = doc(
    db,
    "games",
    normalizedRoomId,
    "presence",
    userId,
  );

  await setDoc(
    presenceReference,
    {
      userId,
      status,
      lastSeenAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      merge: true,
    },
  );
}

export function subscribeToPlayerPresence({ roomId, userId, onData, onError }) {
  const normalizedRoomId = normalizeRoomId(roomId);

  const presenceReference = doc(
    db,
    "games",
    normalizedRoomId,
    "presence",
    userId,
  );

  return onSnapshot(
    presenceReference,
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
