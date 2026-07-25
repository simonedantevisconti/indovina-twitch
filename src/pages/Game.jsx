import { useEffect, useState } from "react";

import {
  Link,
  Navigate,
  useParams,
} from "react-router-dom";

import StreamerCard from "../components/StreamerCard";

import { useAuth } from "../context/AuthContext";

import {
  createPrivateGameState,
  resetEliminatedStreamers,
  subscribeToGame,
  subscribeToPrivateGameState,
  toggleEliminatedStreamer,
} from "../firebase/gameService";

import streamers from "../data/streamers";

import "../styles/game.css";

export default function Game() {
  const { roomId } = useParams();
  const { currentUser } = useAuth();

  const [game, setGame] =
    useState(null);

  const [privateState, setPrivateState] =
    useState(null);

  const [gameLoading, setGameLoading] =
    useState(true);

  const [gameMissing, setGameMissing] =
    useState(false);

  const [actionLoading, setActionLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const unsubscribe =
      subscribeToGame({
        roomId,

        onData: async (gameData) => {
          if (!gameData) {
            setGameMissing(true);
            setGame(null);
            setGameLoading(false);
            return;
          }

          setGame(gameData);
          setGameMissing(false);

          if (
            !gameData.playerIds?.includes(
              currentUser.uid,
            )
          ) {
            setGameLoading(false);
            return;
          }

          try {
            await createPrivateGameState({
              roomId,
              userId: currentUser.uid,
              boardStreamerIds:
                gameData.boardStreamerIds,
            });
          } catch (currentError) {
            console.error(
              "Errore creazione stato privato:",
              currentError,
            );

            setError(
              "Non è stato possibile assegnare il personaggio segreto.",
            );
          }

          setGameLoading(false);
        },

        onError: (currentError) => {
          console.error(
            "Errore caricamento partita:",
            currentError,
          );

          setError(
            "Non è stato possibile caricare la partita.",
          );

          setGameLoading(false);
        },
      });

    return unsubscribe;
  }, [roomId, currentUser.uid]);

  useEffect(() => {
    const unsubscribe =
      subscribeToPrivateGameState({
        roomId,
        userId: currentUser.uid,

        onData: (privateData) => {
          setPrivateState(privateData);
        },

        onError: (currentError) => {
          console.error(
            "Errore stato privato:",
            currentError,
          );

          setError(
            "Non è stato possibile sincronizzare il tabellone.",
          );
        },
      });

    return unsubscribe;
  }, [roomId, currentUser.uid]);

  const boardStreamerIds = game?.boardStreamerIds ?? [];

  const boardStreamers = boardStreamerIds
    .map((streamerId) =>
      streamers.find(
        (streamer) => streamer.id === streamerId,
      ),
    )
    .filter(Boolean);

  const secretStreamer = privateState?.secretStreamerId
    ? streamers.find(
        (streamer) =>
          streamer.id === privateState.secretStreamerId,
      )
    : null;

  const eliminatedStreamerIds =
    privateState?.eliminatedStreamerIds ||
    [];

  const availableStreamersCount =
    boardStreamers.length -
    eliminatedStreamerIds.length;

  const isCurrentPlayerTurn =
    game?.currentTurn === currentUser.uid;

  const opponent =
    game?.players?.host?.uid ===
    currentUser.uid
      ? game?.players?.guest
      : game?.players?.host;

  const handleToggleStreamer = async (
    streamerId,
  ) => {
    if (actionLoading) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await toggleEliminatedStreamer({
        roomId,
        userId: currentUser.uid,
        streamerId,
      });
    } catch (currentError) {
      console.error(
        "Errore eliminazione streamer:",
        currentError,
      );

      setError(
        "Non è stato possibile aggiornare la carta.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetBoard = async () => {
    try {
      setActionLoading(true);
      setError("");

      await resetEliminatedStreamers({
        roomId,
        userId: currentUser.uid,
      });
    } catch (currentError) {
      console.error(
        "Errore ripristino griglia:",
        currentError,
      );

      setError(
        "Non è stato possibile ripristinare la griglia.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (gameLoading) {
    return (
      <section className="game-loading">
        <div
          className="spinner-border"
          role="status"
        >
          <span className="visually-hidden">
            Caricamento...
          </span>
        </div>

        <p>Preparazione della partita...</p>
      </section>
    );
  }

  if (gameMissing) {
    return (
      <Navigate
        to="/room-not-found"
        replace
      />
    );
  }

  if (
    !game?.playerIds?.includes(
      currentUser.uid,
    )
  ) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  return (
    <section className="game-page">
      <div className="container-fluid game-container">
        <header className="game-header">
          <div>
            <p className="section-eyebrow">
              Partita 1 contro 1
            </p>

            <h1>Indovina lo streamer</h1>

            <p className="game-header__room">
              Stanza:{" "}
              <strong>{roomId}</strong>
            </p>
          </div>

          <div className="game-header__actions">
            <button
              className="btn button-secondary"
              type="button"
              disabled={
                actionLoading ||
                eliminatedStreamerIds.length ===
                  0
              }
              onClick={handleResetBoard}
            >
              Ripristina griglia
            </button>

            <Link
              className="btn btn-outline-danger"
              to="/"
            >
              Abbandona
            </Link>
          </div>
        </header>

        {error && (
          <div
            className="alert alert-danger"
            role="alert"
          >
            {error}
          </div>
        )}

        <div
          className={`turn-banner ${
            isCurrentPlayerTurn
              ? "turn-banner--active"
              : ""
          }`}
        >
          <span>
            {isCurrentPlayerTurn
              ? "È il tuo turno"
              : `Turno di ${
                  opponent?.username ||
                  "avversario"
                }`}
          </span>

          <strong>
            Turno {game.turnNumber || 1}
          </strong>
        </div>

        <div className="game-secret-section">
          <div className="game-secret-card">
            <span>
              Il tuo personaggio segreto
            </span>

            {secretStreamer ? (
              <div className="game-secret-card__content">
                <img
                  src={secretStreamer.image}
                  alt={secretStreamer.name}
                />

                <div>
                  <strong>
                    {secretStreamer.name}
                  </strong>

                  <small>
                    @
                    {
                      secretStreamer.twitchUsername
                    }
                  </small>
                </div>
              </div>
            ) : (
              <p>
                Assegnazione in corso...
              </p>
            )}
          </div>

          <div className="game-opponent-card">
            <span>Il tuo avversario</span>
            <strong>
              {opponent?.username ||
                "Giocatore"}
            </strong>
          </div>
        </div>

        <div className="game-status">
          <div className="game-status__item">
            <span>
              Streamer disponibili
            </span>
            <strong>
              {availableStreamersCount}
            </strong>
          </div>

          <div className="game-status__item">
            <span>
              Streamer eliminati
            </span>
            <strong>
              {
                eliminatedStreamerIds.length
              }
            </strong>
          </div>

          <div className="game-status__item">
            <span>Stato partita</span>
            <strong>
              {game.status === "playing"
                ? "In corso"
                : game.status}
            </strong>
          </div>
        </div>

        <div className="streamers-grid">
          {boardStreamers.map(
            (streamer) => (
              <StreamerCard
                key={streamer.id}
                streamer={streamer}
                isEliminated={eliminatedStreamerIds.includes(
                  streamer.id,
                )}
                onToggle={
                  handleToggleStreamer
                }
              />
            ),
          )}
        </div>
      </div>
    </section>
  );
}