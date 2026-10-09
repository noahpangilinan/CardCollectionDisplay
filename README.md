# Noah Pangilinan’s Deck Collection

A personal (not for sale) collection of my playing card decks, built with React + Vite and deployed on Netlify.

## Develop

```sh
npm install
npm run dev
```

## Data

- `src/decks.json` — one entry per deck design (`qty` for duplicates).
  - `image` is what the grid shows, `product` is the store product shot (if found),
    `photo` is the deck cropped from my shelf photo (`reference/collection-photo.jpeg`).
  - `fit` is `contain` for clean white-background shots, `cover` otherwise.
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
npm run deck hub ice-dragon https://playingcardhub.com/decks/...   # front/back scans
npm run deck add -- --id ice-dragon --name "Ice Dragon" --brand Bicycle --hub https://playingcardhub.com/decks/...
npm run deck bump ice-dragon                                      # bought a second copy
npm run deck check                                                # validate decks.json + images
```

## Deploy

Netlify picks up `netlify.toml` (`npm run build`, publish `dist`).
