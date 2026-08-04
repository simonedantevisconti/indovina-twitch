import { useEffect, useMemo, useState } from "react";

import { useAuth } from "../context/AuthContext";

import {
  subscribeToRecentMatches,
  subscribeToUserProfile,
} from "../firebase/profileService";

import "../styles/auth.css";

export default function Profile() {
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToUserProfile({
      userId: currentUser.uid,
      onData: (profileData) => {
        setProfile(profileData);
        setProfileLoading(false);
      },
      onError: (currentError) => {
        console.error("Errore caricamento profilo:", currentError);

        setProfileError("Non è stato possibile caricare il profilo.");

        setProfileLoading(false);
      },
    });

    return unsubscribe;
  }, [currentUser.uid]);

  useEffect(() => {
    const unsubscribe = subscribeToRecentMatches({
      userId: currentUser.uid,
      onData: (matchesData) => {
        setRecentMatches(matchesData);
      },
      onError: (currentError) => {
        console.error("Errore caricamento storico:", currentError);
      },
    });

    return unsubscribe;
  }, [currentUser.uid]);

  const username =
    profile?.username ||
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "Giocatore";

  const gamesPlayed = profile?.gamesPlayed || 0;
  const gamesWon = profile?.gamesWon || 0;
  const gamesLost = profile?.gamesLost || 0;

  const winRate = useMemo(() => {
    if (gamesPlayed === 0) {
      return 0;
    }

    return Math.round((gamesWon / gamesPlayed) * 100);
  }, [gamesPlayed, gamesWon]);

  if (profileLoading) {
    return (
      <section className="profile-page">
        <div className="container">
          <div className="profile-card">
            <p>Caricamento profilo...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="profile-page">
      <div className="container">
        {profileError && (
          <div className="profile-error" role="alert">
            {profileError}
          </div>
        )}

        <div className="profile-card">
          <div className="profile-card__avatar">
            {profile?.photoURL || currentUser?.photoURL ? (
              <img
                src={profile?.photoURL || currentUser.photoURL}
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

            <p>{profile?.email || currentUser?.email}</p>
          </div>

          <div className="profile-stats">
            <article>
              <span>Partite</span>
              <strong>{gamesPlayed}</strong>
            </article>

            <article>
              <span>Vittorie</span>
              <strong>{gamesWon}</strong>
            </article>

            <article>
              <span>Sconfitte</span>
              <strong>{gamesLost}</strong>
            </article>

            <article>
              <span>Percentuale vittorie</span>
              <strong>{winRate}%</strong>
            </article>
          </div>

          <div className="profile-history">
            <p className="section-eyebrow">Ultime partite</p>

            {recentMatches.length === 0 ? (
              <p className="profile-history__empty">
                Non hai ancora partite registrate.
              </p>
            ) : (
              <div className="profile-history__list">
                {recentMatches.map((match) => (
                  <article className="profile-history__item" key={match.id}>
                    <div>
                      <strong>
                        {match.result === "win" ? "Vittoria" : "Sconfitta"}
                      </strong>

                      <span>
                        contro {match.opponentUsername || "avversario"}
                      </span>
                    </div>

                    <small>Turni: {match.turnNumber || 1}</small>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
