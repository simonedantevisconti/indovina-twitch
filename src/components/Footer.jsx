import { Link } from "react-router-dom";

import "../styles/footer.css";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__content">
          <div>
            <Link className="footer__brand" to="/">
              Indovina Twitch
            </Link>

            <p className="footer__description">
              Sfida un amico e prova a indovinare il suo streamer.
            </p>
          </div>

          <nav className="footer__links" aria-label="Link del footer">
            <Link to="/">Homepage</Link>
            <a href="/#how-it-works">Come si gioca</a>
            <span>Privacy</span>
            <span>Termini</span>
          </nav>
        </div>

        <div className="footer__bottom">
          <p>© {currentYear} Indovina Twitch</p>

          <p>
            Developed by
            <a href="https://syndycore.com" target="_blank" rel="noreferrer">
              Syndycore
            </a>
          </p>
        </div>

        <p className="footer__disclaimer">
          Progetto indipendente non affiliato, sponsorizzato o approvato da
          Twitch Interactive, Inc.
        </p>
      </div>
    </footer>
  );
}
