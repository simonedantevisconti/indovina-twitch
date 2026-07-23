import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const { login, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination = location.state?.from?.pathname || "/";

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    setFormError("");
  };

  const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/invalid-email":
        return "L'indirizzo email inserito non è valido.";

      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Email o password non corretti.";

      case "auth/user-disabled":
        return "Questo account è stato disabilitato.";

      case "auth/too-many-requests":
        return "Troppi tentativi. Riprova più tardi.";

      case "auth/popup-closed-by-user":
        return "La finestra di accesso Google è stata chiusa.";

      case "auth/popup-blocked":
        return "Il browser ha bloccato la finestra di accesso Google.";

      case "auth/network-request-failed":
        return "Errore di rete. Controlla la connessione.";

      default:
        return "Accesso non riuscito. Riprova.";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.email.trim() || !formData.password) {
      setFormError("Inserisci email e password.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      await login({
        email: formData.email.trim(),
        password: formData.password,
      });

      navigate(destination, { replace: true });
    } catch (error) {
      console.error("Errore login:", error);

      setFormError(getFirebaseErrorMessage(error.code));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSubmitting(true);
      setFormError("");

      await loginWithGoogle();

      navigate(destination, { replace: true });
    } catch (error) {
      console.error("Errore Google:", error);

      setFormError(getFirebaseErrorMessage(error.code));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="container">
        <div className="auth-card">
          <div className="auth-card__heading">
            <p className="section-eyebrow">Bentornato</p>

            <h1>Accedi</h1>

            <p>Entra nel tuo account e raggiungi la prossima partita.</p>
          </div>

          {formError && (
            <div className="alert alert-danger" role="alert">
              {formError}
            </div>
          )}

          <button
            className="btn auth-google-button"
            type="button"
            disabled={isSubmitting}
            onClick={handleGoogleLogin}
          >
            Continua con Google
          </button>

          <div className="auth-divider">
            <span>oppure</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="loginEmail">
                Email
              </label>

              <input
                id="loginEmail"
                className="form-control"
                type="email"
                name="email"
                value={formData.email}
                autoComplete="email"
                disabled={isSubmitting}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="loginPassword">
                Password
              </label>

              <input
                id="loginPassword"
                className="form-control"
                type="password"
                name="password"
                value={formData.password}
                autoComplete="current-password"
                disabled={isSubmitting}
                onChange={handleChange}
              />
            </div>

            <button
              className="btn button-primary auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Accesso..." : "Accedi"}
            </button>
          </form>

          <p className="auth-card__switch">
            Non hai ancora un account? <Link to="/register">Registrati</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
