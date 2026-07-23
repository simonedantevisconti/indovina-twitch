import { Link } from "react-router-dom";

import "../styles/errors.css";

export default function RoomNotFound() {
  return (
    <section className="error-page">
      <div className="container">
        <div className="error-page__content">
          <p className="error-page__code">404</p>

          <h1>Stanza non trovata</h1>

          <p>
            La stanza non esiste, è scaduta oppure è stata chiusa dall’host.
          </p>

          <Link className="btn button-primary" to="/">
            Torna alla Homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
