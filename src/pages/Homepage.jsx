import { useState } from "react";
import { useNavigate } from "react-router-dom";

import "../styles/homepage.css";

export default function Homepage() {
  const navigate = useNavigate();

  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");

  const handleCreateRoom = () => {
    setError("");

    /*
      Per ora utilizziamo una stanza dimostrativa.
      In futuro il codice verrà creato da Firebase.
    */
    navigate("/game/demo-room");
  };

  const handleJoinRoom = (event) => {
    event.preventDefault();

    const normalizedRoomCode = roomCode.trim().toUpperCase();

    if (!normalizedRoomCode) {
      setError("Inserisci il codice della stanza.");
      return;
    }

    if (normalizedRoomCode.length < 4) {
      setError("Il codice della stanza deve contenere almeno 4 caratteri.");
      return;
    }

    setError("");
    navigate(`/game/${normalizedRoomCode}`);
  };

  return (
    <>
      <section className="homepage-hero">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <p className="homepage-hero__eyebrow">
                Il gioco degli streamer italiani
              </p>

              <h1 className="homepage-hero__title">
                Quanto conosci il mondo di Twitch?
              </h1>

              <p className="homepage-hero__description">
                Crea una stanza, invita un amico e prova a indovinare il suo
                streamer facendo le domande giuste.
              </p>

              <div className="homepage-hero__actions">
                <button
                  className="btn button-primary"
                  type="button"
                  onClick={handleCreateRoom}
                >
                  Crea una stanza
                </button>

                <a className="btn button-secondary" href="#join-room">
                  Entra in una stanza
                </a>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="homepage-preview">
                <div className="homepage-preview__badge">
                  Partita 1 contro 1
                </div>

                <div className="homepage-preview__grid">
                  {Array.from({ length: 12 }, (_, index) => (
                    <div className="homepage-preview__card" key={index}>
                      <span>?</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="homepage-section" id="join-room">
        <div className="container">
          <div className="homepage-section__heading">
            <p className="section-eyebrow">Partecipa</p>
            <h2>Entra nella stanza di un amico</h2>
            <p>
              Inserisci il codice che ti è stato condiviso per raggiungere la
              sala d’attesa.
            </p>
          </div>

          <form className="join-room-form" onSubmit={handleJoinRoom} noValidate>
            <label className="form-label" htmlFor="roomCode">
              Codice stanza
            </label>

            <div className="join-room-form__controls">
              <input
                id="roomCode"
                className={`form-control ${error ? "is-invalid" : ""}`}
                type="text"
                value={roomCode}
                placeholder="Esempio: ABC123"
                maxLength={12}
                autoComplete="off"
                onChange={(event) => {
                  setRoomCode(event.target.value);
                  setError("");
                }}
              />

              <button className="btn button-primary" type="submit">
                Entra
              </button>
            </div>

            {error && <div className="invalid-feedback d-block">{error}</div>}
          </form>
        </div>
      </section>

      <section
        className="homepage-section homepage-section--alternative"
        id="how-it-works"
      >
        <div className="container">
          <div className="homepage-section__heading">
            <p className="section-eyebrow">Come funziona</p>
            <h2>Tre passaggi per iniziare</h2>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <article className="info-card">
                <span className="info-card__number">01</span>
                <h3>Crea la stanza</h3>
                <p>Scegli se creare una partita privata o pubblica.</p>
              </article>
            </div>

            <div className="col-md-4">
              <article className="info-card">
                <span className="info-card__number">02</span>
                <h3>Invita un amico</h3>
                <p>Condividi il link o il codice generato dal gioco.</p>
              </article>
            </div>

            <div className="col-md-4">
              <article className="info-card">
                <span className="info-card__number">03</span>
                <h3>Indovina lo streamer</h3>
                <p>Fai domande, elimina i personaggi e tenta la risposta.</p>
              </article>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
