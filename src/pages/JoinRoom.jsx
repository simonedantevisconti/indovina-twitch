import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { joinRoomByCode } from "../firebase/roomService";

import "../styles/lobby.css";

function getRoomErrorMessage(errorCode) {
  switch (errorCode) {
    case "room/not-found":
      return "Non esiste una stanza con questo codice.";

    case "room/full":
      return "La stanza è già piena.";

    case "room/not-available":
      return "La partita è già iniziata o non è disponibile.";

    default:
      return "Non è stato possibile entrare nella stanza.";
  }
}

export default function JoinRoom() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    const normalizedRoomCode = roomCode.trim().toUpperCase();

    if (normalizedRoomCode.length !== 6) {
      setError("Il codice della stanza deve contenere 6 caratteri.");
      return;
    }

    try {
      setIsJoining(true);
      setError("");

      const roomId = await joinRoomByCode({
        roomCode: normalizedRoomCode,
        user: currentUser,
      });

      navigate(`/room/${roomId}`);
    } catch (currentError) {
      console.error("Errore ingresso stanza:", currentError);

      setError(getRoomErrorMessage(currentError.message));
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <section className="lobby-page">
      <div className="container">
        <div className="join-room-card">
          <div className="lobby-heading">
            <p className="section-eyebrow">Invito ricevuto</p>

            <h1>Entra in una stanza</h1>

            <p>Inserisci il codice di sei caratteri condiviso dal tuo amico.</p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <label className="form-label" htmlFor="joinRoomCode">
              Codice stanza
            </label>

            <input
              id="joinRoomCode"
              className="form-control room-code-input"
              type="text"
              value={roomCode}
              placeholder="ABC123"
              maxLength={6}
              autoComplete="off"
              disabled={isJoining}
              onChange={(event) => {
                const nextValue = event.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "");

                setRoomCode(nextValue);
                setError("");
              }}
            />

            <button
              className="btn button-primary lobby-submit"
              type="submit"
              disabled={isJoining}
            >
              {isJoining ? "Ingresso..." : "Entra nella stanza"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
