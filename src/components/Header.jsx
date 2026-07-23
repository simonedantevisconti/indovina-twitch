import { Link, NavLink, useNavigate } from "react-router-dom";

import { useState } from "react";

import { useAuth } from "../context/AuthContext";

import logoIndovinaTwitch from "../assets/indovina-twitch-logo.png";

import "../styles/header.css";

export default function Header() {
  const navigate = useNavigate();

  const { currentUser, authLoading, logout } = useAuth();

  const [logoutError, setLogoutError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const getNavLinkClass = ({ isActive }) =>
    isActive ? "header__link header__link--active" : "header__link";

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setLogoutError("");

      await logout();

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Errore logout:", error);
      setLogoutError("Non è stato possibile uscire.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const username =
    currentUser?.displayName || currentUser?.email?.split("@")[0] || "Profilo";

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

              {currentUser && (
                <li className="nav-item">
                  <NavLink className={getNavLinkClass} to="/rooms">
                    Stanze pubbliche
                  </NavLink>
                </li>
              )}
              
              {!authLoading && !currentUser && (
                <>
                  <li className="nav-item">
                    <NavLink
                      className="btn btn-outline-light header__login-button"
                      to="/login"
                    >
                      Accedi
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <NavLink
                      className="btn header__register-button"
                      to="/register"
                    >
                      Registrati
                    </NavLink>
                  </li>
                </>
              )}

              {!authLoading && currentUser && (
                <>
                  <li className="nav-item">
                    <NavLink className={getNavLinkClass} to="/profile">
                      {username}
                    </NavLink>
                  </li>

                  <li className="nav-item">
                    <button
                      className="btn btn-outline-light header__login-button"
                      type="button"
                      disabled={isLoggingOut}
                      onClick={handleLogout}
                    >
                      {isLoggingOut ? "Uscita..." : "Logout"}
                    </button>
                  </li>
                </>
              )}
            </ul>

            {logoutError && <p className="header__error">{logoutError}</p>}
          </div>
        </div>
      </nav>
    </header>
  );
}
