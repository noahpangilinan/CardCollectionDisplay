# Noah Pangilinan’s Deck Collection

A personal (not for sale) collection of my playing card decks, built with React + Vite and deployed on Netlify.

**Live at [noahpangscards.com](https://noahpangscards.com).**

- A grid of every deck, with a running count of decks in the collection.
- Filter by maker (Bicycle, theory11, NOC, Cherry Casino, others), search by name, or shuffle the order.
- Click a deck to open it: flip the tuck box front to back, or switch to the card back, the store
  product shot, or the deck on my shelf. Each deck shows its retail price, and the URL links straight to it.
- Cards tilt toward the cursor.

## Develop

```sh
npm install
npm run dev
```

## Data

- `src/decks.json` — one entry per deck design (`qty` for duplicates).
  - `image` is what the grid shows, `product` is the store product shot (if found),
    `photo` is the deck cropped from my shelf photo (`reference/collection-photo.jpeg`).
  - `front` and `back` are the tuck box scans, and `cardBack` is a single card's back.
  - `fit` is `contain` for clean white-background shots, `cover` otherwise.
  - `price` is the retail price in USD. `priceSource` is `listed` (the deck's own store price),
    `similar` (a comparable deck) or `estimate`, and anything but `listed` shows with a ≈.
  - `source`, `hub` and `deckcollect` link to the store page, PlayingCardHub and DeckCollect.
- `public/decks/` — the images.

Decks named generically (e.g. "Gold & Black Bicycle", "Low Poly Skull") weren't identified
yet — rename them in `decks.json` and drop a better image into `public/decks/`.

## Adding a deck

**With Claude Code:** attach a photo of the new deck(s) (or drop it into `inbox/`, which is gitignored) and say
"add these decks". This works from the Claude mobile app too, via Remote Control.
The `add-deck` skill (`.claude/skills/add-deck/`) crops the photo, identifies each deck, pulls the tuck scans
from PlayingCardHub, updates `decks.json`, and pushes.

**By hand**, with `scripts/deck.mjs` (`npm run deck help` lists every command):

```sh
npm run deck grid inbox/new.jpg                                   # photo + 10% grid, to find crop boxes
npm run deck crop inbox/new.jpg ice-dragon -- --box 0.4,0.2,0.1,0.07 --rotate 270
npm run deck search ice dragon bicycle                            # find the PlayingCardHub page
npm run deck hub ice-dragon https://playingcardhub.com/decks/...   # front/back scans
npm run deck price ice dragon bicycle                             # retail price from playingcarddecks.com
npm run deck add -- --id ice-dragon --name "Ice Dragon" --brand Bicycle --hub https://playingcardhub.com/decks/... --price 9.99 --price-source listed
npm run deck bump ice-dragon                                      # bought a second copy
npm run deck check                                                # validate decks.json + images
```

## Deploy

Netlify picks up `netlify.toml` (`npm run build`, publish `dist`).
