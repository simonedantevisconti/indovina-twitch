import { useAuth } from "../context/AuthContext";

import "../styles/auth.css";

export default function Profile() {
  const { currentUser } = useAuth();

  const username =
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "Giocatore";

  return (
    <section className="profile-page">
      <div className="container">
        <div className="profile-card">
          <div className="profile-card__avatar">
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={`Avatar di ${username}`}
                referrerPolicy="no-referrer"
              />
            ) : (
              <span>{username.charAt(0).toUpperCase()}</span>
            )}
          </div>

          <div>
            <p className="section-eyebrow">Il tuo profilo</p>
            <h1>{username}</h1>
            <p>{currentUser?.email}</p>
          </div>

          <div className="profile-stats">
            <article>
              <span>Partite</span>
              <strong>0</strong>
            </article>

            <article>
              <span>Vittorie</span>
              <strong>0</strong>
            </article>

            <article>
              <span>Sconfitte</span>
              <strong>0</strong>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
