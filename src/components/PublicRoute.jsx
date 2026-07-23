import { Navigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export default function PublicRoute({ children }) {
  const { currentUser, authLoading } = useAuth();

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

        <p>Caricamento...</p>
      </section>
    );
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
}
