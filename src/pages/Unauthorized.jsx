import { Link } from "react-router-dom";

import "../styles/errors.css";

export default function Unauthorized() {
  return (
    <section className="error-page">
      <div className="container">
        <div className="error-page__content">
          <p className="error-page__code">403</p>

          <h1>Accesso non autorizzato</h1>

          <p>
            Non fai parte di questa stanza oppure non hai i permessi necessari.
          </p>

          <Link className="btn button-primary" to="/">
            Torna alla Homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
