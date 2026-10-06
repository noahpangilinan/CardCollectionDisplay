import { useEffect, useState } from 'react'
import { useTilt } from '../useTilt.js'

export default function DeckModal({ deck, onClose, onPrev, onNext, position }) {
  const tilt = useTilt(22)
  const hasProduct = Boolean(deck.product)
  const [view, setView] = useState('product')

  useEffect(() => setView('product'), [deck.id])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  const showPhoto = !hasProduct || view === 'photo'
  const src = showPhoto ? deck.photo : deck.product
  // Landscape front/back product shots don't survive a portrait crop, so letterbox them.
  const fit = showPhoto ? 'cover' : deck.image === deck.product ? deck.fit : 'contain'

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={deck.name} onClick={onClose}>
      <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="modal-stage">
          <div className="modal-card" key={src} {...tilt}>
            <img src={src} alt={deck.name} className={`fit-${fit}`} />
            <span className="glare" />
          </div>
        </div>

        <div className="modal-info">
          <p className="eyebrow">
            No. {String(position.index + 1).padStart(3, '0')} / {position.total}
          </p>
          <h2>{deck.name}</h2>
          <p className="modal-brand">{deck.brand}</p>
          {deck.qty > 1 && <p className="modal-qty">{deck.qty} copies on the shelf</p>}

          {hasProduct && (
            <div className="toggle" role="tablist">
              <button role="tab" aria-selected={view === 'product'} onClick={() => setView('product')}>
                Product shot
              </button>
              <button role="tab" aria-selected={view === 'photo'} onClick={() => setView('photo')}>
                On my shelf
              </button>
            </div>
          )}

          {deck.source && (
            <a className="source" href={deck.source} target="_blank" rel="noreferrer">
              View deck ↗
            </a>
          )}

          <div className="modal-nav">
            <button onClick={onPrev} aria-label="Previous deck">←</button>
            <button onClick={onNext} aria-label="Next deck">→</button>
          </div>
        </div>
      </div>
    </div>
  )
}
