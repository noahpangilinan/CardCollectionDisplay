# The Deck Archive

A React + Vite site showcasing my playing card collection. Deployed on Netlify.

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

## Deploy

Netlify picks up `netlify.toml` (`npm run build`, publish `dist`).
