---
name: add-deck
description: Add newly bought playing card decks to the collection site from a photo. Use when Noah shares a photo (or a path to one) of one or more decks and says something like "add this deck", "I bought these", or "new decks". Crops the shelf photo, identifies each deck, pulls tuck scans from PlayingCardHub, updates src/decks.json, and pushes to main so Netlify redeploys.
---

# Add decks from a photo

All mechanical steps go through `npm run -s deck <command>` (`scripts/deck.mjs`; `npm run -s deck help` for usage).
Image conventions: `public/decks/<id>-photo.jpg` (shelf crop), `-front.jpg` / `-back.jpg` (tuck scans, 500×700).

## 1. Look
- Use the photo wherever it is: a path Noah gives, a file in `inbox/` (gitignored), or the saved path Claude Code
  reports for an attachment (from the mobile app via Remote Control, photos land under `~/.claude/uploads/`).
  Pass that path straight to `grid`/`crop`, with no need to copy it. Only if an attached photo has no file on disk
  (e.g. some cloud sessions) ask Noah to send it another way.
- HEIC won't decode. Ask for a JPG (iPhone: Settings → Camera → Formats → Most Compatible, or share/export as JPG).
- View the photo with Read, then run `npm run -s deck grid inbox/<photo>` and Read `inbox/.grid-<photo>.jpg`.
  The magenta lines mark tenths of the (upright) image; use them for crop boxes.
- Identify every deck: full name including edition/colour/version, and brand. Note how each one is turned.

## 2. Dedupe
Search `src/decks.json` for each deck by name and by similar ids. If it's already in the collection, it's
a second copy: plan `npm run -s deck bump <id>` instead of a new entry, and skip steps 3–5 for it.

## 3. Crop
- id = kebab-case of the name, e.g. `Ice Dragon` → `ice-dragon`, `NOC Pro Navy Blue` → `noc-pro-navy-blue`.
- `npm run -s deck crop inbox/<photo> <id> -- --box x,y,w,h [--rotate 90|180|270]`
  - Box values are fractions of the image (0–1). Hug the tuck box with a hair of margin.
  - `--rotate` is clockwise and should leave the deck standing upright with its title reading normally.
    (A deck lying with its top edge pointing right needs `270`.)
- Read `public/decks/<id>-photo.jpg` and re-crop until it's tight and upright.

## 4. Find the scans
- WebSearch `site:playingcardhub.com "<name>"` (add the brand if the results are noisy). The site's own search
  is client-rendered, so don't fetch it.
- Pick the `https://playingcardhub.com/decks/<ulid>-<slug>` page for the exact edition. Editions and colours
  are easy to mix up, so WebFetch the page and compare it with the crop: colour, year, gilding, "V2", etc.
- `npm run -s deck hub <id> <hub url>` downloads the front scan, plus the back scan if the page has one.
  Read the front to confirm it matches.
- Optional: a deckcollect.com deck page (`--deckcollect`) or a shop page (`--source`) for extra links.
- If no hub page exists, carry on anyway: `add` uses the shelf crop as the front image.

## 5. Add
`npm run -s deck add -- --id <id> --name "<Name>" --brand "<Brand>" [--qty N] [--hub URL] [--deckcollect URL] [--source URL]`
- Brand must reuse an existing spelling from decks.json (the filter chips in `src/App.jsx` match
  `Bicycle`, `theory11`, `NOC` and `Pure Imagination` exactly). `add` warns on a new brand. If you see that
  warning, double-check the brand. Use `Other` if the maker is unknown.

## 6. Verify
`npm run -s deck check` and `npm run -s build` must both pass. Then delete `dist/`.

## 7. Report, then push
- Show a short table: deck, added/bumped, hub match (yes/no), confidence.
- All confident → commit only the new/changed files (`src/decks.json`, `public/decks/<id>-*`), with the
  message `Add <Name>[, <Name>…]` (or `Add N decks` for a long list). Then `git push` to main. Netlify deploys
  automatically from main. In a cloud session, if pushing to main is refused, push a branch, open a PR, and
  tell Noah it needs merging before it goes live.
- Anything uncertain (couldn't read the title, two plausible editions, no hub match) → list the doubts and
  ask before committing.
- Leave the raw photo in `inbox/`. It's gitignored.
