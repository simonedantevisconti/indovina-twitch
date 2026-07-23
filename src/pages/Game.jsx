import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import StreamerCard from "../components/StreamerCard";
import streamers from "../data/streamers";

import "../styles/game.css";

export default function Game() {
  const { roomId } = useParams();

  const [eliminatedStreamers, setEliminatedStreamers] = useState([]);

  const activeStreamersCount = useMemo(
    () => streamers.length - eliminatedStreamers.length,
    [eliminatedStreamers],
  );

  const handleToggleStreamer = (streamerId) => {
    setEliminatedStreamers((currentEliminated) => {
      const isAlreadyEliminated = currentEliminated.includes(streamerId);

      if (isAlreadyEliminated) {
        return currentEliminated.filter(
          (currentId) => currentId !== streamerId,
        );
      }

      return [...currentEliminated, streamerId];
    });
  };

  const handleResetBoard = () => {
    setEliminatedStreamers([]);
  };

  return (
    <section className="game-page">
      <div className="container-fluid game-container">
        <header className="game-header">
          <div>
            <p className="section-eyebrow">Partita 1 contro 1</p>

            <h1>Indovina lo streamer</h1>

            <p className="game-header__room">
              Stanza: <strong>{roomId}</strong>
            </p>
          </div>

          <div className="game-header__actions">
            <button
              className="btn button-secondary"
              type="button"
              onClick={handleResetBoard}
              disabled={eliminatedStreamers.length === 0}
            >
              Ripristina griglia
            </button>

            <Link className="btn button-secondary" to="/">
              Abbandona
            </Link>
          </div>
        </header>

        <div className="game-status">
          <div className="game-status__item">
            <span>Streamer disponibili</span>
            <strong>{activeStreamersCount}</strong>
          </div>

          <div className="game-status__item">
            <span>Streamer eliminati</span>
            <strong>{eliminatedStreamers.length}</strong>
          </div>

          <div className="game-status__item">
            <span>Turno</span>
            <strong>Il tuo turno</strong>
          </div>
        </div>

        <div className="streamers-grid">
          {streamers.map((streamer) => (
            <StreamerCard
              key={streamer.id}
              streamer={streamer}
              isEliminated={eliminatedStreamers.includes(streamer.id)}
              onToggle={handleToggleStreamer}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
