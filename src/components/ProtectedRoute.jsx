import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { currentUser, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <section className="auth-loading">
        <div
          className="spinner-border text-light"
          role="status"
          aria-label="Caricamento"
        >
          <span className="visually-hidden">Caricamento...</span>
        </div>

        <p>Controllo della sessione...</p>
      </section>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
