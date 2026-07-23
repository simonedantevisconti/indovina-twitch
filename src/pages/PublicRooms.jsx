import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import { joinRoomById, subscribeToPublicRooms } from "../firebase/roomService";

import "../styles/lobby.css";

export default function PublicRooms() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningRoomId, setJoiningRoomId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToPublicRooms({
      onData: (publicRooms) => {
        setRooms(publicRooms);
        setLoading(false);
      },

      onError: (currentError) => {
        console.error("Errore stanze pubbliche:", currentError);

        setError("Non è stato possibile caricare le stanze pubbliche.");

        setLoading(false);
      },
    });

    return unsubscribe;
  }, []);

  const handleJoinRoom = async (roomId) => {
    try {
      setJoiningRoomId(roomId);
      setError("");

      await joinRoomById({
        roomId,
        user: currentUser,
      });

      navigate(`/room/${roomId}`);
    } catch (currentError) {
      console.error("Errore ingresso stanza pubblica:", currentError);

      if (currentError.message === "room/full") {
        setError("La stanza è stata occupata da un altro giocatore.");
      } else {
        setError("Non è stato possibile entrare nella stanza.");
      }
    } finally {
      setJoiningRoomId("");
    }
  };

  return (
    <section className="lobby-page">
      <div className="container">
        <div className="public-rooms-header">
          <div className="lobby-heading">
            <p className="section-eyebrow">Matchmaking</p>

            <h1>Stanze pubbliche</h1>

            <p>Entra in una partita creata da un altro giocatore.</p>
          </div>

          <button
            className="btn button-primary"
            type="button"
            onClick={() => navigate("/lobby")}
          >
            Crea stanza
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading && (
          <div className="rooms-loading">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Caricamento...</span>
            </div>

            <p>Ricerca delle stanze disponibili...</p>
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div className="rooms-empty">
            <span>🎮</span>
            <h2>Nessuna stanza disponibile</h2>
            <p>Crea una nuova stanza pubblica e attendi un avversario.</p>

            <button
              className="btn button-primary"
              type="button"
              onClick={() => navigate("/lobby")}
            >
              Crea stanza
            </button>
          </div>
        )}

        {!loading && rooms.length > 0 && (
          <div className="public-rooms-grid">
            {rooms.map((room) => {
              const hostName = room.players?.host?.username || "Giocatore";

              return (
                <article className="public-room-card" key={room.id}>
                  <div>
                    <span className="public-room-card__status">In attesa</span>

                    <h2>Stanza di {hostName}</h2>

                    <p>
                      Codice: <strong>{room.roomCode}</strong>
                    </p>
                  </div>

                  <button
                    className="btn button-primary"
                    type="button"
                    disabled={Boolean(joiningRoomId)}
                    onClick={() => handleJoinRoom(room.id)}
                  >
                    {joiningRoomId === room.id ? "Ingresso..." : "Entra"}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
