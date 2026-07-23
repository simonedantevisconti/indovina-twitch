import "../styles/streamer-card.css";

export default function StreamerCard({ streamer, isEliminated, onToggle }) {
  const handleClick = () => {
    onToggle(streamer.id);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle(streamer.id);
    }
  };

  return (
    <article
      className={`streamer-card ${
        isEliminated ? "streamer-card--eliminated" : ""
      }`}
      role="button"
      tabIndex={0}
      aria-pressed={isEliminated}
      aria-label={
        isEliminated
          ? `Ripristina ${streamer.name}`
          : `Elimina ${streamer.name}`
      }
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      <div className="streamer-card__image-wrapper">
        <img
          className="streamer-card__image"
          src={streamer.image}
          alt={streamer.name}
        />

        <div className="streamer-card__overlay">
          <span>{isEliminated ? "Eliminato" : "Seleziona"}</span>
        </div>
      </div>

      <div className="streamer-card__content">
        <h2>{streamer.name}</h2>

        <p>@{streamer.twitchUsername}</p>
      </div>
    </article>
  );
}
