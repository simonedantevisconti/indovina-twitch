import { Link, NavLink } from "react-router-dom";

import logoIndovinaTwitch from "../assets/indovina-twitch-logo.png";

import "../styles/header.css";

export default function Header() {
  const getNavLinkClass = ({ isActive }) =>
    isActive ? "header__link header__link--active" : "header__link";

  return (
    <header className="header">
      <nav className="navbar navbar-expand-lg navbar-dark">
        <div className="container">
          <Link className="header__brand" to="/">
            <img
              className="header__logo"
              src={logoIndovinaTwitch}
              alt="Logo Indovina Twitch"
            />

            <span>Indovina Twitch</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Apri menu di navigazione"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
              <li className="nav-item">
                <NavLink className={getNavLinkClass} to="/">
                  Homepage
                </NavLink>
              </li>

              <li className="nav-item">
                <a className="header__link" href="/#how-it-works">
                  Come si gioca
                </a>
              </li>

              <li className="nav-item">
                <button
                  className="btn btn-outline-light header__login-button"
                  type="button"
                >
                  Accedi
                </button>
              </li>

              <li className="nav-item">
                <button className="btn header__register-button" type="button">
                  Registrati
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </header>
  );
}
