import { useEffect, useMemo, useState } from "react";

import { Navigate, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import {
  joinRoomById,
  leaveRoom,
  startRoom,
  subscribeToRoom,
  togglePlayerReady,
} from "../firebase/roomService";

import "../styles/waiting-room.css";

function PlayerSlot({ player, label, isReady }) {
  return (
    <article className={`player-slot ${player ? "player-slot--occupied" : ""}`}>
      <div className="player-slot__avatar">
        {player?.photoURL ? (
          <img src={player.photoURL} alt="" referrerPolicy="no-referrer" />
        ) : (
          <span>{player ? player.username.charAt(0).toUpperCase() : "?"}</span>
        )}
      </div>

      <div>
        <span className="player-slot__label">{label}</span>

        <h2>{player?.username || "In attesa del giocatore"}</h2>

        {player && (
          <span
            className={`player-ready-status ${
              isReady ? "player-ready-status--ready" : ""
            }`}
          >
            {isReady ? "Pronto" : "Non pronto"}
          </span>
        )}
      </div>
    </article>
  );
}

export default function WaitingRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roomMissing, setRoomMissing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const connectToRoom = async () => {
      try {
        await joinRoomById({
          roomId,
          user: currentUser,
        });
      } catch (currentError) {
        if (currentError.message !== "room/not-available") {
          console.error("Errore collegamento stanza:", currentError);
        }
      }

      if (!isMounted) {
        return;
      }

      const unsubscribe = subscribeToRoom({
        roomId,

        onData: (roomData) => {
          if (!roomData) {
            setRoomMissing(true);
            setRoom(null);
          } else {
            setRoom(roomData);
            setRoomMissing(false);
          }

          setLoading(false);
        },

        onError: (currentError) => {
          console.error("Errore ascolto stanza:", currentError);

          setError("Non è stato possibile sincronizzare la stanza.");

          setLoading(false);
        },
      });

      return unsubscribe;
    };

    let unsubscribe;

    connectToRoom().then((listener) => {
      unsubscribe = listener;
    });

    return () => {
      isMounted = false;

      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [roomId, currentUser]);

  const isHost = room?.hostId === currentUser.uid;

  const playerIds = room?.playerIds || [];
  const readyPlayers = room?.readyPlayers || [];

  const currentPlayerIsReady = readyPlayers.includes(currentUser.uid);

  const allPlayersAreReady = useMemo(() => {
    if (playerIds.length !== 2) {
      return false;
    }

    return playerIds.every((playerId) => readyPlayers.includes(playerId));
  }, [playerIds, readyPlayers]);

  const invitationLink = `${window.location.origin}/room/${roomId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(invitationLink);

      setCopySuccess(true);

      window.setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (currentError) {
      console.error("Errore copia link:", currentError);

      setError("Non è stato possibile copiare il link.");
    }
  };

  const handleReady = async () => {
    try {
      setActionLoading(true);
      setError("");

      await togglePlayerReady({
        roomId,
        userId: currentUser.uid,
      });
    } catch (currentError) {
      console.error("Errore stato pronto:", currentError);

      setError("Non è stato possibile aggiornare lo stato.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    try {
      setActionLoading(true);

      await leaveRoom({
        roomId,
        userId: currentUser.uid,
      });

      navigate("/", { replace: true });
    } catch (currentError) {
      console.error("Errore abbandono stanza:", currentError);

      setError("Non è stato possibile abbandonare la stanza.");

      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      setActionLoading(true);
      setError("");

      await startRoom({
        roomId,
        userId: currentUser.uid,
      });
    } catch (currentError) {
      console.error("Errore avvio partita:", currentError);

      switch (currentError.message) {
        case "room/not-enough-players":
          setError("Deve entrare un secondo giocatore.");
          break;

        case "room/players-not-ready":
          setError("Entrambi i giocatori devono essere pronti.");
          break;

        default:
          setError("Non è stato possibile avviare la partita.");
      }

      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (room?.status === "starting") {
      navigate(`/game/${roomId}`, {
        replace: true,
      });
    }
  }, [room?.status, roomId, navigate]);

  if (loading) {
    return (
      <section className="waiting-loading">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>

        <p>Collegamento alla stanza...</p>
      </section>
    );
  }

  if (roomMissing) {
    return <Navigate to="/room-not-found" replace />;
  }

  const currentUserBelongsToRoom = playerIds.includes(currentUser.uid);

  if (!currentUserBelongsToRoom) {
    return <Navigate to="/unauthorized" replace />;
  }

  return (
    <section className="waiting-room-page">
      <div className="container">
        <div className="waiting-room-heading">
          <div>
            <p className="section-eyebrow">Sala d’attesa</p>

            <h1>Preparati alla sfida</h1>

            <p>
              La partita inizierà quando entrambi i giocatori saranno pronti.
            </p>
          </div>

          <div className="room-code-box">
            <span>Codice stanza</span>
            <strong>{room.roomCode}</strong>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="invitation-box">
          <div>
            <span>Link di invito</span>
            <p>{invitationLink}</p>
          </div>

          <button
            className="btn button-secondary"
            type="button"
            onClick={handleCopyLink}
          >
            {copySuccess ? "Link copiato!" : "Copia link"}
          </button>
        </div>

        <div className="players-grid">
          <PlayerSlot
            player={room.players?.host}
            label="Host"
            isReady={readyPlayers.includes(room.hostId)}
          />

          <div className="players-versus">VS</div>

          <PlayerSlot
            player={room.players?.guest}
            label="Ospite"
            isReady={room.guestId ? readyPlayers.includes(room.guestId) : false}
          />
        </div>

        <div className="waiting-room-actions">
          <button
            className={`btn ${
              currentPlayerIsReady ? "button-secondary" : "button-primary"
            }`}
            type="button"
            disabled={actionLoading}
            onClick={handleReady}
          >
            {currentPlayerIsReady ? "Annulla pronto" : "Sono pronto"}
          </button>

          {isHost && (
            <button
              className="btn button-primary"
              type="button"
              disabled={actionLoading || !allPlayersAreReady}
              onClick={handleStart}
            >
              Avvia partita
            </button>
          )}

          <button
            className="btn btn-outline-danger"
            type="button"
            disabled={actionLoading}
            onClick={handleLeave}
          >
            {isHost ? "Chiudi stanza" : "Abbandona stanza"}
          </button>
        </div>

        {!room.players?.guest && (
          <p className="waiting-room-message">
            In attesa che un altro giocatore entri nella stanza...
          </p>
        )}
      </div>
    </section>
  );
}
