import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { createRoom } from "../firebase/roomService";

import "../styles/lobby.css";

export default function Lobby() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [selectedType, setSelectedType] = useState("private");

  const [isCreating, setIsCreating] = useState(false);

  const [error, setError] = useState("");

  const handleCreateRoom = async () => {
    try {
      setIsCreating(true);
      setError("");

      const room = await createRoom({
        user: currentUser,
        type: selectedType,
      });

      navigate(`/room/${room.id}`);
    } catch (currentError) {
      console.error("Errore creazione stanza:", currentError);

      setError("Non è stato possibile creare la stanza. Riprova.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="lobby-page">
      <div className="container">
        <div className="lobby-heading">
          <p className="section-eyebrow">Nuova partita</p>

          <h1>Crea la tua stanza</h1>

          <p>
            Scegli se invitare direttamente un amico oppure rendere la stanza
            visibile agli altri giocatori.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <div className="row g-4">
          <div className="col-md-6">
            <button
              className={`room-type-card ${
                selectedType === "private" ? "room-type-card--selected" : ""
              }`}
              type="button"
              onClick={() => setSelectedType("private")}
            >
              <span className="room-type-card__icon">🔒</span>

              <span className="room-type-card__content">
                <strong>Stanza privata</strong>

                <span>
                  Entra soltanto chi riceve il codice o il link della stanza.
                </span>
              </span>
            </button>
          </div>

          <div className="col-md-6">
            <button
              className={`room-type-card ${
                selectedType === "public" ? "room-type-card--selected" : ""
              }`}
              type="button"
              onClick={() => setSelectedType("public")}
            >
              <span className="room-type-card__icon">🌐</span>

              <span className="room-type-card__content">
                <strong>Stanza pubblica</strong>

                <span>
                  La stanza apparirà nell’elenco delle partite disponibili.
                </span>
              </span>
            </button>
          </div>
        </div>

        <div className="lobby-actions">
          <button
            className="btn button-primary"
            type="button"
            disabled={isCreating}
            onClick={handleCreateRoom}
          >
            {isCreating ? "Creazione..." : "Crea stanza"}
          </button>
        </div>
      </div>
    </section>
  );
}
