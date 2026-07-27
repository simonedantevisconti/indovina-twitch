import { useEffect, useState } from "react";
import {
  Link,
  Navigate,
  useParams,
} from "react-router-dom";

import StreamerCard from "../components/StreamerCard";
import { useAuth } from "../context/AuthContext";

import {
  answerQuestion,
  createPrivateGameState,
  resetEliminatedStreamers,
  submitQuestion,
  subscribeToGame,
  subscribeToPrivateGameState,
  subscribeToQuestions,
  toggleEliminatedStreamer,
} from "../firebase/gameService";

import streamers from "../data/streamers";

import "../styles/game.css";

const answerLabels = {
  yes: "Sì",
  no: "No",
  unknown: "Non so",
};

export default function Game() {
  const { roomId } = useParams();
  const { currentUser } = useAuth();

  const [game, setGame] = useState(null);
  const [privateState, setPrivateState] = useState(null);
  const [questions, setQuestions] = useState([]);

  const [questionText, setQuestionText] = useState("");

  const [gameLoading, setGameLoading] = useState(true);
  const [gameMissing, setGameMissing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = subscribeToGame({
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

  useEffect(() => {
    const unsubscribe = subscribeToQuestions({
      roomId,

      onData: (questionsData) => {
        setQuestions(questionsData);
      },

      onError: (currentError) => {
        console.error(
          "Errore caricamento domande:",
          currentError,
        );

        setError(
          "Non è stato possibile sincronizzare le domande.",
        );
      },
    });

    return unsubscribe;
  }, [roomId]);

  const boardStreamers = game?.boardStreamerIds
    ? game.boardStreamerIds
        .map((streamerId) =>
          streamers.find(
            (streamer) =>
              streamer.id === streamerId,
          ),
        )
        .filter(Boolean)
    : [];

  const secretStreamer =
    privateState?.secretStreamerId
      ? streamers.find(
          (streamer) =>
            streamer.id ===
            privateState.secretStreamerId,
        )
      : null;

  const eliminatedStreamerIds =
    privateState?.eliminatedStreamerIds || [];

  const availableStreamersCount =
    boardStreamers.length -
    eliminatedStreamerIds.length;

  const isCurrentPlayerTurn =
    game?.currentTurn === currentUser.uid;

  const opponent =
    game?.players?.host?.uid === currentUser.uid
      ? game?.players?.guest
      : game?.players?.host;

  const pendingQuestion = game?.pendingQuestionId
    ? questions.find(
        (question) =>
          question.id ===
          game.pendingQuestionId,
      )
    : null;

  const canSubmitQuestion =
    isCurrentPlayerTurn &&
    !game?.pendingQuestionId &&
    game?.status === "playing";

  const canAnswerQuestion =
    pendingQuestion &&
    pendingQuestion.authorId !==
      currentUser.uid &&
    pendingQuestion.status === "pending";

  const getPlayerName = (userId) => {
    if (
      game?.players?.host?.uid === userId
    ) {
      return (
        game.players.host.username || "Host"
      );
    }

    if (
      game?.players?.guest?.uid === userId
    ) {
      return (
        game.players.guest.username ||
        "Ospite"
      );
    }

    return "Giocatore";
  };

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

  const handleSubmitQuestion = async (
    event,
  ) => {
    event.preventDefault();

    const normalizedQuestion =
      questionText.trim();

    if (!normalizedQuestion) {
      setError(
        "Scrivi una domanda prima di inviarla.",
      );
      return;
    }

    if (!canSubmitQuestion) {
      setError(
        "Non puoi fare una domanda in questo momento.",
      );
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await submitQuestion({
        roomId,
        userId: currentUser.uid,
        text: normalizedQuestion,
      });

      setQuestionText("");
    } catch (currentError) {
      console.error(
        "Errore invio domanda:",
        currentError,
      );

      switch (currentError.message) {
        case "game/not-your-turn":
          setError(
            "Non è ancora il tuo turno.",
          );
          break;

        case "game/question-already-pending":
          setError(
            "Devi attendere la risposta alla domanda precedente.",
          );
          break;

        case "game/question-too-long":
          setError(
            "La domanda non può superare 200 caratteri.",
          );
          break;

        default:
          setError(
            "Non è stato possibile inviare la domanda.",
          );
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAnswerQuestion = async (
    answer,
  ) => {
    if (!pendingQuestion) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      await answerQuestion({
        roomId,
        questionId: pendingQuestion.id,
        userId: currentUser.uid,
        answer,
      });
    } catch (currentError) {
      console.error(
        "Errore risposta domanda:",
        currentError,
      );

      switch (currentError.message) {
        case "game/cannot-answer-own-question":
          setError(
            "Non puoi rispondere alla tua domanda.",
          );
          break;

        case "game/question-already-answered":
          setError(
            "La domanda ha già ricevuto una risposta.",
          );
          break;

        default:
          setError(
            "Non è stato possibile inviare la risposta.",
          );
      }
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
              <p>Assegnazione in corso...</p>
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

        <section className="card bg-dark border-secondary mb-4">
          <div className="card-body">
            <p className="section-eyebrow">
              Domande
            </p>

            {canSubmitQuestion && (
              <form
                onSubmit={
                  handleSubmitQuestion
                }
              >
                <label
                  className="form-label"
                  htmlFor="gameQuestion"
                >
                  Fai una domanda al tuo
                  avversario
                </label>

                <textarea
                  id="gameQuestion"
                  className="form-control"
                  value={questionText}
                  placeholder="Esempio: il tuo streamer porta gli occhiali?"
                  maxLength={200}
                  rows={3}
                  disabled={actionLoading}
                  onChange={(event) => {
                    setQuestionText(
                      event.target.value,
                    );
                    setError("");
                  }}
                />

                <div className="d-flex justify-content-between align-items-center gap-3 mt-3">
                  <small className="text-secondary">
                    {questionText.length}/200
                  </small>

                  <button
                    className="btn button-primary"
                    type="submit"
                    disabled={
                      actionLoading ||
                      !questionText.trim()
                    }
                  >
                    Invia domanda
                  </button>
                </div>
              </form>
            )}

            {pendingQuestion &&
              pendingQuestion.authorId ===
                currentUser.uid && (
                <div className="alert alert-info mb-0">
                  <strong>
                    Domanda inviata:
                  </strong>{" "}
                  {pendingQuestion.text}
                  <div className="mt-2">
                    In attesa della risposta
                    dell’avversario...
                  </div>
                </div>
              )}

            {canAnswerQuestion && (
              <div>
                <p className="mb-2">
                  <strong>
                    {
                      getPlayerName(
                        pendingQuestion.authorId,
                      )
                    }
                  </strong>{" "}
                  ti chiede:
                </p>

                <h2 className="h4 mb-4">
                  “{pendingQuestion.text}”
                </h2>

                <div className="d-flex flex-wrap gap-2">
                  <button
                    className="btn btn-success"
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      handleAnswerQuestion(
                        "yes",
                      )
                    }
                  >
                    Sì
                  </button>

                  <button
                    className="btn btn-danger"
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      handleAnswerQuestion(
                        "no",
                      )
                    }
                  >
                    No
                  </button>

                  <button
                    className="btn btn-warning"
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      handleAnswerQuestion(
                        "unknown",
                      )
                    }
                  >
                    Non so
                  </button>
                </div>
              </div>
            )}

            {!canSubmitQuestion &&
              !pendingQuestion && (
                <p className="text-secondary mb-0">
                  Attendi il turno
                  dell’avversario.
                </p>
              )}
          </div>
        </section>

        {questions.length > 0 && (
          <section className="card bg-dark border-secondary mb-4">
            <div className="card-body">
              <p className="section-eyebrow">
                Storico della partita
              </p>

              <div className="d-flex flex-column gap-3">
                {questions.map(
                  (question) => (
                    <article
                      className="border border-secondary rounded p-3"
                      key={question.id}
                    >
                      <div className="d-flex justify-content-between flex-wrap gap-2">
                        <strong>
                          {getPlayerName(
                            question.authorId,
                          )}
                        </strong>

                        <small className="text-secondary">
                          Turno{" "}
                          {question.turnNumber}
                        </small>
                      </div>

                      <p className="my-2">
                        {question.text}
                      </p>

                      <span
                        className={`badge ${
                          question.status ===
                          "pending"
                            ? "text-bg-warning"
                            : "text-bg-primary"
                        }`}
                      >
                        {question.status ===
                        "pending"
                          ? "In attesa"
                          : answerLabels[
                              question.answer
                            ] ||
                            question.answer}
                      </span>
                    </article>
                  ),
                )}
              </div>
            </div>
          </section>
        )}

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