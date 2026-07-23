import { Link } from "react-router-dom";

import "../styles/errors.css";

export default function NotFound() {
  return (
    <section className="error-page">
      <div className="container">
        <div className="error-page__content">
          <p className="error-page__code">404</p>

          <h1>Pagina non trovata</h1>

          <p>La pagina che stai cercando non esiste oppure è stata spostata.</p>

          <Link className="btn button-primary" to="/">
            Torna alla Homepage
          </Link>
        </div>
      </div>
    </section>
  );
}
