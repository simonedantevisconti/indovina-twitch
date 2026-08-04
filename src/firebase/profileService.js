import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "./firebaseConfig";

export function subscribeToUserProfile({ userId, onData, onError }) {
  const userReference = doc(db, "users", userId);

  return onSnapshot(
    userReference,
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

export function subscribeToRecentMatches({
  userId,
  onData,
  onError,
  matchesLimit = 5,
}) {
  const historyReference = collection(db, "users", userId, "matchHistory");

  const historyQuery = query(
    historyReference,
    orderBy("finishedAt", "desc"),
    limit(matchesLimit),
  );

  return onSnapshot(
    historyQuery,
    (snapshot) => {
      const matches = snapshot.docs.map((matchDocument) => ({
        id: matchDocument.id,
        ...matchDocument.data(),
      }));

      onData(matches);
    },
    onError,
  );
}

export async function recordCompletedMatch({
  roomId,
  userId,
  opponentId,
  opponentUsername,
  result,
  finishReason,
  roundNumber,
  turnNumber,
  winningStreamerId,
}) {
  const normalizedRoomId = roomId.trim().toUpperCase();

  if (result !== "win" && result !== "loss") {
    throw new Error("profile/invalid-result");
  }

  const normalizedRoundNumber = roundNumber || 1;

  const matchId = `${normalizedRoomId}-round-${normalizedRoundNumber}`;

  const userReference = doc(db, "users", userId);

  const matchReference = doc(db, "users", userId, "matchHistory", matchId);

  await runTransaction(db, async (transaction) => {
    const userSnapshot = await transaction.get(userReference);
    const matchSnapshot = await transaction.get(matchReference);

    if (!userSnapshot.exists()) {
      throw new Error("profile/user-not-found");
    }

    /*
     * La partita è già stata registrata.
     * Non incrementiamo nuovamente le statistiche.
     */
    if (matchSnapshot.exists()) {
      return;
    }

    const userData = userSnapshot.data();

    const gamesPlayed = userData.gamesPlayed || 0;
    const gamesWon = userData.gamesWon || 0;
    const gamesLost = userData.gamesLost || 0;

    const currentWinStreak = userData.currentWinStreak || 0;
    const bestWinStreak = userData.bestWinStreak || 0;

    const isWin = result === "win";

    const nextWinStreak = isWin ? currentWinStreak + 1 : 0;

    transaction.set(matchReference, {
      matchId,
      roomId: normalizedRoomId,
      roundNumber: normalizedRoundNumber,

      userId,
      opponentId: opponentId || null,
      opponentUsername: opponentUsername || "Avversario",

      result,
      finishReason: finishReason || null,

      turnNumber: turnNumber || 1,
      winningStreamerId: winningStreamerId || null,

      finishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });

    transaction.update(userReference, {
      gamesPlayed: gamesPlayed + 1,
      gamesWon: gamesWon + (isWin ? 1 : 0),
      gamesLost: gamesLost + (isWin ? 0 : 1),

      currentWinStreak: nextWinStreak,
      bestWinStreak: Math.max(bestWinStreak, nextWinStreak),

      lastGameAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}
