import { useCallback, useEffect, useMemo, useState } from 'react'
import decks from './decks.json'
import DeckTile from './components/DeckTile.jsx'
import DeckModal from './components/DeckModal.jsx'

const GROUPS = [
  { label: 'All', test: () => true },
  { label: 'Bicycle', test: (d) => d.brand === 'Bicycle' },
  { label: 'theory11', test: (d) => d.brand === 'theory11' },
  { label: 'NOC', test: (d) => d.brand === 'NOC' },
  { label: 'Cherry Casino', test: (d) => d.brand === 'Pure Imagination' },
  {
    label: 'Indie & Other',
    test: (d) => !['Bicycle', 'theory11', 'NOC', 'Pure Imagination'].includes(d.brand),
  },
]

const FAN = ['fyrebird', 'ice', 'spellbound', 'marquis', 'the-lion-king', 'panda', 'shin-lim']

const totalDecks = decks.reduce((n, d) => n + d.qty, 0)
const makers = new Set(decks.map((d) => d.brand)).size

function shuffled(list) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function App() {
  const [group, setGroup] = useState('All')
  const [query, setQuery] = useState('')
  const [order, setOrder] = useState(decks)
  const [shuffleKey, setShuffleKey] = useState(0)
  const [openId, setOpenId] = useState(() => {
    const id = decodeURIComponent(window.location.hash.slice(1))
    return decks.some((d) => d.id === id) ? id : null
  })

  // Keep the open deck in the URL hash so it can be linked to directly.
  useEffect(() => {
    const url = openId ? `#${openId}` : window.location.pathname + window.location.search
    window.history.replaceState(null, '', url)
  }, [openId])

  const visible = useMemo(() => {
    const g = GROUPS.find((x) => x.label === group)
    const q = query.trim().toLowerCase()
    return order.filter(
      (d) => g.test(d) && (!q || d.name.toLowerCase().includes(q) || d.brand.toLowerCase().includes(q)),
    )
  }, [order, group, query])

  const fan = useMemo(() => FAN.map((id) => decks.find((d) => d.id === id)).filter(Boolean), [])

  const openIndex = visible.findIndex((d) => d.id === openId)
  const openDeck = openIndex >= 0 ? visible[openIndex] : null
  const step = useCallback(
    (dir) => setOpenId(visible[(openIndex + dir + visible.length) % visible.length].id),
    [visible, openIndex],
  )
  const close = useCallback(() => setOpenId(null), [])
  const prev = useCallback(() => step(-1), [step])
  const next = useCallback(() => step(1), [step])

  return (
    <>
      <header className="hero">
        <div className="hero-copy">
          <p className="eyebrow">A personal collection</p>
          <h1>
            The Deck
            <br />
            <em>Archive</em>
          </h1>
          <dl className="stats">
            <div>
              <dt>Decks</dt>
              <dd>{totalDecks}</dd>
            </div>
            <div>
              <dt>Designs</dt>
              <dd>{decks.length}</dd>
            </div>
            <div>
              <dt>Makers</dt>
              <dd>{makers}</dd>
            </div>
          </dl>
        </div>

        <div className="fan" aria-hidden="true">
          {fan.map((d, i) => (
            <div
              key={d.id}
              className="fan-card"
              style={{ '--n': i - (fan.length - 1) / 2 }}
              onClick={() => {
                setGroup('All')
                setQuery('')
                setOpenId(d.id)
              }}
            >
              <img src={d.image} alt="" className={`fit-${d.fit}`} />
            </div>
          ))}
        </div>
      </header>

      <nav className="controls">
        <div className="chips" role="tablist" aria-label="Filter by maker">
          {GROUPS.map((g) => {
            const count = decks.filter(g.test).length
            return (
              <button
                key={g.label}
                role="tab"
                aria-selected={group === g.label}
                className="chip"
                onClick={() => setGroup(g.label)}
              >
                {g.label}
                <span>{count}</span>
              </button>
            )
          })}
        </div>
        <div className="controls-right">
          <input
            type="search"
            placeholder="Search decks…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search decks"
          />
          <button
            className="shuffle"
            onClick={() => {
              setOrder(shuffled(decks))
              setShuffleKey((k) => k + 1)
            }}
          >
            Shuffle ♠
          </button>
        </div>
      </nav>

      <main className="grid" key={`${group}-${shuffleKey}`}>
        {visible.map((d, i) => (
          <DeckTile key={d.id} deck={d} index={Math.min(i, 40)} onOpen={(x) => setOpenId(x.id)} />
        ))}
        {visible.length === 0 && <p className="empty">No decks match “{query}”.</p>}
      </main>

      <footer className="footer">
        <p>Deck scans via deckcollect.com · product images via playingcarddecks.com and artofplay.com · shelf photos are my own.</p>
      </footer>

      {openDeck && (
        <DeckModal
          deck={openDeck}
          position={{ index: openIndex, total: visible.length }}
          onClose={close}
          onPrev={prev}
          onNext={next}
        />
      )}
    </>
  )
}
