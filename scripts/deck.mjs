// Helper CLI for adding decks. Run `npm run deck help` for usage.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'src', 'decks.json')
const IMG_DIR = path.join(ROOT, 'public', 'decks')
const INBOX = path.join(ROOT, 'inbox')

const FIELDS = ['id', 'name', 'brand', 'qty', 'photo', 'image', 'fit', 'product', 'front', 'back', 'cardBack', 'source', 'hub', 'deckcollect']
const IMAGE_FIELDS = ['photo', 'image', 'product', 'front', 'back', 'cardBack']

const USAGE = `Usage: npm run deck <command> -- [args]

  grid  <photo>                          photo with a labeled 10% grid -> inbox/.grid-<name>.jpg
  crop  <photo> <id> --box x,y,w,h [--rotate 90|180|270]
                                         crop (fractions 0-1), turn upright -> <id>-photo.jpg
  search <words...> [--pages N]          find PlayingCardHub deck pages, best name matches first (★ = all words)
  hub   <id> <playingcardhub url>        download tuck front/back scans -> <id>-front/-back.jpg
                                         (also updates the entry if <id> is already in decks.json)
  add   --id --name --brand [--qty N] [--hub URL] [--deckcollect URL] [--source URL]
  bump  <id> [n]                         add n (default 1) to a deck's qty
  check                                  validate decks.json, list decks still missing a scan`

// ---------- helpers ----------

function parseArgs(argv) {
  const pos = []
  const opts = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith('--')) {
      const key = a.slice(2)
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true
      opts[key] = val
    } else pos.push(a)
  }
  return { pos, opts }
}

function fail(msg) {
  console.error(`✗ ${msg}`)
  process.exit(1)
}

const pub = (file) => `/decks/${file}`
const local = (p) => path.join(ROOT, 'public', p.replace(/^\//, ''))
const exists = (file) => fs.existsSync(path.join(IMG_DIR, file))

function readDecks() {
  const raw = fs.readFileSync(DATA, 'utf8')
  return { decks: JSON.parse(raw), eol: raw.includes('\r\n') ? '\r\n' : '\n', trailing: /\r?\n$/.test(raw) }
}

// Preserve the file's existing line endings and trailing-newline style to keep diffs clean.
function writeDecks({ decks, eol, trailing }) {
  let out = JSON.stringify(decks, null, 2).replace(/\n/g, eol)
  if (trailing) out += eol
  fs.writeFileSync(DATA, out)
}

function checkId(id) {
  if (!id || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) fail(`id must be kebab-case, got "${id}"`)
}

async function saveJpeg(input, file, { fit = 'inside' } = {}) {
  const info = await sharp(input)
    .rotate()
    .resize(500, 700, { fit, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(IMG_DIR, file))
  console.log(`✓ public/decks/${file} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`)
}

// ---------- commands ----------

async function grid([photo]) {
  if (!photo) fail('grid needs a photo path')
  const img = sharp(photo).rotate()
  const { data, info } = await img.resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).toBuffer({ resolveWithObject: true })
  const { width: w, height: h } = info
  const font = Math.round(Math.max(w, h) / 55)
  let lines = ''
  let labels = ''
  for (let k = 1; k < 10; k++) {
    const x = (w * k) / 10
    const y = (h * k) / 10
    lines += `<line x1="${x}" y1="0" x2="${x}" y2="${h}"/><line x1="0" y1="${y}" x2="${w}" y2="${y}"/>`
    labels += `<text x="${x + 4}" y="${font + 2}">0.${k}</text><text x="4" y="${y - 4}">0.${k}</text>`
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <g stroke="#ff00d4" stroke-width="2" stroke-opacity="0.8">${lines}</g>
    <g font-family="sans-serif" font-size="${font}" font-weight="bold" fill="#ff00d4" stroke="#000" stroke-width="1">${labels}</g>
  </svg>`
  fs.mkdirSync(INBOX, { recursive: true })
  const out = path.join(INBOX, `.grid-${path.parse(photo).name}.jpg`)
  await sharp(data).composite([{ input: Buffer.from(svg) }]).jpeg({ quality: 85 }).toFile(out)
  console.log(`✓ ${path.relative(ROOT, out)} (${w}×${h})`)
}

async function crop([photo, id], { box, rotate }) {
  if (!photo) fail('crop needs a photo path')
  checkId(id)
  const nums = String(box ?? '').split(',').map(Number)
  if (nums.length !== 4 || nums.some((n) => !(n >= 0 && n <= 1))) fail('--box must be x,y,w,h as fractions 0-1')
  const [x, y, bw, bh] = nums
  // Bake in EXIF rotation first so the box matches what the grid image shows.
  const upright = await sharp(photo).rotate().toBuffer({ resolveWithObject: true })
  const { width: W, height: H } = upright.info
  const left = Math.round(x * W)
  const top = Math.round(y * H)
  const width = Math.min(Math.round(bw * W), W - left)
  const height = Math.min(Math.round(bh * H), H - top)
  const turn = Number(rotate ?? 0)
  if (![0, 90, 180, 270, -90].includes(turn)) fail('--rotate must be 90, 180, 270 or -90 (clockwise degrees)')
  const cropped = await sharp(upright.data).extract({ left, top, width, height }).rotate(turn).toBuffer()
  await saveJpeg(cropped, `${id}-photo.jpg`)
}

const words = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean)
const unescape = (s) =>
  s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')

// PlayingCardHub's /decks?q= search is server-rendered (25 per page) but not ranked by relevance,
// so pull a few pages and rank by how many of the query's words appear in each deck name.
async function search(pos, { pages = '2' }) {
  const query = pos.join(' ')
  if (!query) fail('search needs a query, e.g. npm run deck search lady moon')
  const found = new Map()
  for (let page = 1; page <= Number(pages); page++) {
    const url = `https://playingcardhub.com/decks?${new URLSearchParams({ q: query, page })}`
    const res = await fetch(url)
    if (!res.ok) fail(`fetching ${url} -> HTTP ${res.status}`)
    const html = await res.text()
    const re = /href="(https:\/\/playingcardhub\.com\/decks\/01[a-z0-9]{24}-[a-z0-9-]*)"[^>]*>\s*<img src="[^"]*" alt="([^"]*?) Thumbnail"/g
    const before = found.size
    for (const [, link, name] of html.matchAll(re)) if (!found.has(link)) found.set(link, unescape(name))
    if (found.size === before) break
  }
  const want = words(query)
  const ranked = [...found]
    .map(([link, name]) => {
      const have = new Set(words(name))
      return { link, name, score: want.filter((w) => have.has(w)).length / want.length }
    })
    .sort((a, b) => b.score - a.score || a.name.length - b.name.length)
  if (!ranked.length) fail(`no results for "${query}". Try fewer or different words`)
  for (const r of ranked.slice(0, 12)) console.log(`${r.score === 1 ? '★' : ' '} ${r.name}\n    ${r.link}`)
}

async function hub([id, url]) {
  checkId(id)
  if (!/^https:\/\/playingcardhub\.com\/decks\//.test(url ?? '')) fail('hub needs a https://playingcardhub.com/decks/... url')
  url = url.split(/[?#]/)[0]
  const res = await fetch(url)
  if (!res.ok) fail(`fetching ${url} -> HTTP ${res.status}`)
  const html = (await res.text()).replace(/\\\//g, '/')
  const got = []
  for (const side of ['front', 'back']) {
    const m = html.match(new RegExp(`https://[a-z0-9.]+cloudfront\\.net/decks/700x500/\\d+_${side}\\.jpg`))
    if (!m) {
      console.log(`- no ${side} scan on that page`)
      continue
    }
    const img = await fetch(m[0])
    if (!img.ok) fail(`downloading ${m[0]} -> HTTP ${img.status}`)
    await saveJpeg(Buffer.from(await img.arrayBuffer()), `${id}-${side}.jpg`)
    got.push(side)
  }

  // If the deck is already in the collection, point its entry at the new scans.
  const data = readDecks()
  const deck = data.decks.find((d) => d.id === id)
  if (!deck || !got.length) return
  if (got.includes('front')) deck.front = deck.image = pub(`${id}-front.jpg`)
  if (got.includes('back')) deck.back = pub(`${id}-back.jpg`)
  deck.hub = url
  writeDecks(data)
  console.log(`✓ updated "${deck.name}" in decks.json`)
}

function add(_, opts) {
  const { id, name, brand } = opts
  checkId(id)
  if (!name || name === true) fail('--name is required')
  if (!brand || brand === true) fail('--brand is required')
  const data = readDecks()
  if (data.decks.some((d) => d.id === id)) fail(`"${id}" already exists. Use: npm run deck bump ${id}`)
  if (!exists(`${id}-photo.jpg`)) fail(`missing public/decks/${id}-photo.jpg (run crop first)`)

  const brands = new Set(data.decks.map((d) => d.brand))
  if (!brands.has(brand)) console.log(`! "${brand}" is a new brand (existing: ${[...brands].join(', ')})`)

  const front = exists(`${id}-front.jpg`) ? pub(`${id}-front.jpg`) : pub(`${id}-photo.jpg`)
  const qty = opts.qty ? Number(opts.qty) : 1
  if (!Number.isInteger(qty) || qty < 1) fail('--qty must be a positive integer')

  const deck = { id, name, brand, qty, photo: pub(`${id}-photo.jpg`), image: front, fit: 'cover', product: null, front }
  if (exists(`${id}-back.jpg`)) deck.back = pub(`${id}-back.jpg`)
  if (exists(`${id}-cardback.jpg`)) deck.cardBack = pub(`${id}-cardback.jpg`)
  for (const k of ['source', 'hub', 'deckcollect']) if (typeof opts[k] === 'string') deck[k] = opts[k]

  data.decks.push(deck)
  writeDecks(data)
  console.log(`✓ added "${name}" (${data.decks.length} designs)`)
  console.log(JSON.stringify(deck, null, 2))
}

function bump([id, n = '1']) {
  const data = readDecks()
  const deck = data.decks.find((d) => d.id === id)
  if (!deck) fail(`no deck with id "${id}"`)
  const by = Number(n)
  if (!Number.isInteger(by) || by < 1) fail('n must be a positive integer')
  deck.qty += by
  writeDecks(data)
  console.log(`✓ ${deck.name}: qty ${deck.qty - by} -> ${deck.qty}`)
}

function check() {
  const { decks } = readDecks()
  const problems = []
  const seen = new Set()
  for (const d of decks) {
    const who = d.id ?? JSON.stringify(d).slice(0, 40)
    if (seen.has(d.id)) problems.push(`${who}: duplicate id`)
    seen.add(d.id)
    for (const k of ['id', 'name', 'brand', 'qty', 'photo', 'image', 'front']) if (!d[k]) problems.push(`${who}: missing ${k}`)
    for (const k of Object.keys(d)) if (!FIELDS.includes(k)) problems.push(`${who}: unknown field "${k}"`)
    if (d.image !== d.front) problems.push(`${who}: image should equal front`)
    if (!Number.isInteger(d.qty) || d.qty < 1) problems.push(`${who}: qty must be a positive integer`)
    for (const k of IMAGE_FIELDS) if (d[k] && !fs.existsSync(local(d[k]))) problems.push(`${who}: ${k} file not found (${d[k]})`)
  }
  if (problems.length) {
    problems.forEach((p) => console.error(`✗ ${p}`))
    process.exit(1)
  }
  console.log(`✓ ${decks.length} designs, ${decks.reduce((n, d) => n + d.qty, 0)} decks, all files present`)
  const noScan = decks.filter((d) => d.front === d.photo)
  if (noScan.length) console.log(`- using the shelf photo as the front (no scan yet): ${noScan.map((d) => d.id).join(', ')}`)
}

// ---------- main ----------

const commands = { grid, crop, search, hub, add, bump, check }
const [cmd, ...rest] = process.argv.slice(2)
if (!commands[cmd]) {
  console.log(USAGE)
  process.exit(cmd && cmd !== 'help' ? 1 : 0)
}
const { pos, opts } = parseArgs(rest)
await commands[cmd](pos, opts)
