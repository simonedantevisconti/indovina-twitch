import { Link } from "react-router-dom";

import "../styles/errors.css";

export default function ServerError() {
  const handleReload = () => {
    window.location.reload();
  };

  return (
    <section className="error-page">
      <div className="container">
        <div className="error-page__content">
          <p className="error-page__code">500</p>

          <h1>Qualcosa è andato storto</h1>

          <p>
            Si è verificato un errore imprevisto. Ricarica la pagina oppure
            torna alla Homepage.
          </p>

          <div className="d-flex justify-content-center flex-wrap gap-3">
            <button
              className="btn button-primary"
              type="button"
              onClick={handleReload}
            >
              Riprova
            </button>

            <Link className="btn button-secondary" to="/">
              Torna alla Homepage
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
