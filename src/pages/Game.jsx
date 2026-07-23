import { Link, useParams } from "react-router-dom";

import "../styles/game.css";

export default function Game() {
  const { roomId } = useParams();

  return (
    <section className="game-page">
      <div className="container">
        <div className="game-placeholder">
          <p className="section-eyebrow">Stanza di gioco</p>

          <h1>Il gioco verrà costruito qui</h1>

          <p>
            Codice stanza: <strong>{roomId}</strong>
          </p>

          <p className="game-placeholder__description">
            Nei prossimi step aggiungeremo la sala d’attesa, i due giocatori, la
            griglia degli streamer, i turni e la sincronizzazione Firebase.
          </p>

          <Link className="btn button-primary" to="/">
            Torna alla Homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
