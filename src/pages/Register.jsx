import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import "../styles/auth.css";

const initialFormData = {
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

export default function Register() {
  const navigate = useNavigate();

  const { register, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState(initialFormData);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, type, checked, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: type === "checkbox" ? checked : value,
    }));

    setFormError("");
  };

  const validateForm = () => {
    const username = formData.username.trim();
    const email = formData.email.trim();

    if (username.length < 3) {
      return "Il nome utente deve contenere almeno 3 caratteri.";
    }

    if (username.length > 24) {
      return "Il nome utente non può superare 24 caratteri.";
    }

    if (!email) {
      return "Inserisci il tuo indirizzo email.";
    }

    if (formData.password.length < 6) {
      return "La password deve contenere almeno 6 caratteri.";
    }

    if (formData.password !== formData.confirmPassword) {
      return "Le password non coincidono.";
    }

    if (!formData.acceptTerms) {
      return "Devi accettare Privacy Policy e Termini.";
    }

    return "";
  };

  const getFirebaseErrorMessage = (errorCode) => {
    switch (errorCode) {
      case "auth/email-already-in-use":
        return "Esiste già un account associato a questa email.";

      case "auth/invalid-email":
        return "L'indirizzo email inserito non è valido.";

      case "auth/weak-password":
        return "La password scelta è troppo debole.";

      case "auth/popup-closed-by-user":
        return "La finestra di accesso Google è stata chiusa.";

      case "auth/popup-blocked":
        return "Il browser ha bloccato la finestra di accesso Google.";

      case "auth/network-request-failed":
        return "Errore di rete. Controlla la connessione.";

      default:
        return "Registrazione non riuscita. Riprova.";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      await register({
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
      });

      navigate("/", { replace: true });
    } catch (error) {
      console.error("Errore registrazione:", error);

      setFormError(getFirebaseErrorMessage(error.code));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      setIsSubmitting(true);
      setFormError("");

      await loginWithGoogle();

      navigate("/", { replace: true });
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
            <p className="section-eyebrow">Crea il tuo profilo</p>

            <h1>Registrati</h1>

            <p>
              Crea un account per giocare con i tuoi amici e conservare le
              statistiche.
            </p>
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
            onClick={handleGoogleRegister}
          >
            Continua con Google
          </button>

          <div className="auth-divider">
            <span>oppure</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label" htmlFor="registerUsername">
                Nome utente
              </label>

              <input
                id="registerUsername"
                className="form-control"
                type="text"
                name="username"
                value={formData.username}
                minLength={3}
                maxLength={24}
                autoComplete="username"
                disabled={isSubmitting}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="registerEmail">
                Email
              </label>

              <input
                id="registerEmail"
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
              <label className="form-label" htmlFor="registerPassword">
                Password
              </label>

              <input
                id="registerPassword"
                className="form-control"
                type="password"
                name="password"
                value={formData.password}
                minLength={6}
                autoComplete="new-password"
                disabled={isSubmitting}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="registerConfirmPassword">
                Conferma password
              </label>

              <input
                id="registerConfirmPassword"
                className="form-control"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                minLength={6}
                autoComplete="new-password"
                disabled={isSubmitting}
                onChange={handleChange}
              />
            </div>

            <div className="form-check auth-terms">
              <input
                id="acceptTerms"
                className="form-check-input"
                type="checkbox"
                name="acceptTerms"
                checked={formData.acceptTerms}
                disabled={isSubmitting}
                onChange={handleChange}
              />

              <label className="form-check-label" htmlFor="acceptTerms">
                Accetto la Privacy Policy e i Termini di utilizzo.
              </label>
            </div>

            <button
              className="btn button-primary auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Registrazione..." : "Crea account"}
            </button>
          </form>

          <p className="auth-card__switch">
            Hai già un account? <Link to="/login">Accedi</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
