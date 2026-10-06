import { useTilt } from '../useTilt.js'

export default function DeckTile({ deck, index, onOpen }) {
  const tilt = useTilt(16)

  return (
    <button
      className="tile"
      style={{ '--i': index }}
      onClick={() => onOpen(deck)}
      aria-label={`${deck.name} by ${deck.brand}`}
    >
      <div className="tile-card" {...tilt}>
        <img
          src={deck.image}
          alt=""
          loading="lazy"
          decoding="async"
          className={`fit-${deck.fit}`}
        />
        <span className="glare" />
        {deck.qty > 1 && <span className="qty">×{deck.qty}</span>}
      </div>
      <div className="tile-meta">
        <span className="tile-name">{deck.name}</span>
        <span className="tile-brand">{deck.brand}</span>
      </div>
    </button>
  )
}
