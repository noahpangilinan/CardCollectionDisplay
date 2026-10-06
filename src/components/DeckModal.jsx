import { useEffect, useState } from 'react'
import { useTilt } from '../useTilt.js'

function viewsFor(deck) {
  const views = []
  if (deck.front) views.push({ id: 'box', label: deck.back ? 'Tuck box' : 'Front' })
  if (deck.cardBack) views.push({ id: 'card', label: 'Card back' })
  if (deck.product) views.push({ id: 'product', label: 'Product shot' })
  views.push({ id: 'photo', label: 'On my shelf' })
  return views
}

export default function DeckModal({ deck, onClose, onPrev, onNext, position }) {
  const tilt = useTilt(22)
  const views = viewsFor(deck)
  const [view, setView] = useState(views[0].id)
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    setView(viewsFor(deck)[0].id)
    setFlipped(false)
  }, [deck])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') onPrev()
      if (e.key === 'ArrowRight') onNext()
      if (e.key === ' ' || e.key === 'f') {
        e.preventDefault()
        setFlipped((f) => !f)
      }
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, onPrev, onNext])

  const canFlip = view === 'box' && Boolean(deck.back)

  let face
  if (view === 'box') {
    face = (
      <div className={`flipper${canFlip && flipped ? ' is-flipped' : ''}`}>
        <img src={deck.front} alt={`${deck.name} front`} className="face fit-cover" />
        {deck.back && <img src={deck.back} alt={`${deck.name} back`} className="face face-back fit-cover" />}
      </div>
    )
  } else {
    // Landscape front/back product shots don't survive a portrait crop, so letterbox them.
    const src = { card: deck.cardBack, product: deck.product, photo: deck.photo }[view]
    const fit = view === 'product' && deck.image !== deck.product ? 'contain' : view === 'product' ? deck.fit : 'cover'
    face = <img src={src} alt={deck.name} className={`fit-${fit}`} />
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={deck.name} onClick={onClose}>
      <div className="modal-inner" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="modal-stage">
          <div
            className={`modal-card${canFlip ? ' can-flip' : ''}`}
            key={`${deck.id}-${view}`}
            {...tilt}
            onClick={() => canFlip && setFlipped((f) => !f)}
          >
            {face}
            <span className="glare" />
          </div>
          {canFlip && <p className="flip-hint">Click the deck or press F to flip</p>}
        </div>

        <div className="modal-info">
          <p className="eyebrow">
            No. {String(position.index + 1).padStart(3, '0')} / {position.total}
          </p>
          <h2>{deck.name}</h2>
          <p className="modal-brand">{deck.brand}</p>
          {deck.qty > 1 && <p className="modal-qty">{deck.qty} copies on the shelf</p>}

          {views.length > 1 && (
            <div className="toggle" role="tablist">
              {views.map((v) => (
                <button key={v.id} role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)}>
                  {v.label}
                </button>
              ))}
            </div>
          )}

          <div className="links">
            {deck.deckcollect && (
              <a className="source" href={deck.deckcollect} target="_blank" rel="noreferrer">
                Deck Collect ↗
              </a>
            )}
            {deck.source && (
              <a className="source" href={deck.source} target="_blank" rel="noreferrer">
                Shop ↗
              </a>
            )}
          </div>

          <div className="modal-nav">
            <button onClick={onPrev} aria-label="Previous deck">←</button>
            <button onClick={onNext} aria-label="Next deck">→</button>
          </div>
        </div>
      </div>
    </div>
  )
}
