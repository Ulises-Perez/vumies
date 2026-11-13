# Vumies — Web streaming app (Deno Deploy)

Vumies is a web app for watching movies, series and anime, deployed on
**Deno Deploy**. It combines the **TMDB** catalog (metadata, images, search)
with the **Vimeus** player (`vimeus.net`) embedded in an iframe.

There is no desktop build: the app runs entirely in the browser. The Vimeus
API key never reaches the client — the Deno server (`server.ts`) proxies the
listing endpoints with the `X-API-Key` header.

## 🚀 Features

- ✨ **Modern UI**: Vue 3 + TypeScript + Tailwind CSS, with glassmorphism
- 🎬 **Full catalog**: movies, series and anime via TMDB
- 📺 **Integrated player**: Vimeus embeds (`/e/movie`, `/e/serie`, `/e/anime`) in an iframe
- 🔍 **Realtime search** and ❤️ local favorites
- 🔐 **Keys kept server-side**: the Vimeus API key lives only in the Deno environment
- 📱 **Responsive**: adapts from mobile to desktop

## 🧭 Shell

The application chrome is floating and never reserves layout space:

- **`AppTopBar`** — a zero-chrome 48px strip. It has no plate, border, shadow or blur at rest: two
  32px control clusters sit flush to the container edges and the span between them is fully
  transparent, so the artwork behind reads through the middle of the bar. The left cluster is the
  sidebar toggle plus the wordmark (text only); the right one is the search trigger plus the `⌘K`
  keycap. A control only shows a surface on hover and focus. It carries no navigation list, hides
  while you scroll down (and returns when you scroll up), and stays available while the sidebar or
  search is open. It also hides on player routes so it never covers the video.
- **`SideMenu`** — an overlay panel that runs from just under the top bar to the bottom of the
  viewport. It starts **closed** on every load, closes on its toggle, on `Escape`, on a click
  outside and on every route change. It does not push or offset the content; the content keeps the
  full viewport width. It is the only place the theme control lives.
- **`BottomMenu`** — the floating mobile pill with the primary destinations.

UI state lives in two module-level singletons next to the components:
`useSidebar()` (shell panel) and `useCommandPalette()` (`⌘K` / `Ctrl K`). All shell motion is
behind `prefers-reduced-motion` and the app's own `html.reduce-motion` toggle.

## 📐 Layout contract

One layout vocabulary for the whole app; no view defines its own.

| Primitive | Purpose |
| --- | --- |
| `.container-app` / `BaseContainer` | The **only** container: `--container-max` (1440px) plus `--gutter` (16px, 48px from `md`). |
| `.grid-posters` | Poster grid that reflows from `--poster-min`, with no breakpoint ladder. |
| `.rail` | The horizontal scroller: cancels the gutter, scroll-snap, hides the scrollbar. |
| `--hero-sm/md/lg` | The only hero heights (320/384/480px), chosen by view kind — not by viewport height. |
| `--bar-height`, `--bar-offset`, `--chrome-top` | Where the bar sits and where the sidebar and page content start under it. |
| `BaseStack` | Flex stack with the Astryx spacing steps (`gap={2}` is 8px). |

`/`, `MoviesView` and `SeriesView` open with a **mosaic**: a 6-column grid with explicit spans (a
lead tile carrying the title, the score, the synopsis and the primary action, two tall poster
tiles, a full-width row header and three 16/10 art tiles under it), then the rest of the catalogue.
Every piece sits on the grid's column lines, so the gaps are one number (`--grid-gap`) in both
axes and no piece carries its own padding or box. It is one component,
`MosaicHighlights.vue`, so a change to the recipe lands in one place; the views only hand it
resolved tiles. The mosaic uses `auto-rows-[minmax(0,auto)]` and per-tile aspect ratios, never a
fixed row height with taller min-heights: that combination let tiles overflow their rows and paint
over each other on narrow screens.

Posters are served by TMDB, which already negotiates **WebP** from the `Accept` header (measured on
`w342`: 37.6 KB webp against 53.8 KB jpeg), so the app does not convert images: it picks the width
that the slot actually needs through `srcset` + `sizes`, applied only when the image is revealed. A
160px card on a 390px DPR1 screen takes `w185` (13.5 KB) instead of `w342` (37.6 KB), and the mosaic's
wide tiles take `w780` (62 KB) instead of `w1280` (132 KB).

Poster cards answer the pointer with an **ambilight** (the mosaic's lead tile carries it permanently,
as the hero it is): the card's own poster, blurred, fading in
behind the frame. It reuses the poster URL already in cache, primes the layer only when the card is
hovered or focused, and animates `opacity` and `transform` only — measured 0 layouts and no extra
image request per hover.

The mosaic is the opening, so no catalog view renders a hero above it, and its lead is the page's
single `h1`. Text over the tiles uses `text-art*`, which does not follow the theme: the scrims stay
dark in both themes, and theme tokens put near-black text on a near-black scrim in the light theme
(1.15:1).

### Scales ported from Astryx

[Astryx](https://astryx.atmeta.com/docs/getting-started) is React 19 + StyleX only, so it is not a
dependency here. Its token contract is plain CSS custom properties, and those were ported into
`src/style.css`: the spacing steps, `--radius-inner/element/container/page`, the 14px base with a
1.2 ratio and the `--text-3xs..5xl` variables behind the `.type-*` semantic classes, and
`--size-element-sm/md/lg` (28/32/36px). `tailwind.config.js` exposes the new radius and control-height
names alongside the existing ones. `design/system.md` documents every token with its source file.

## 🛠️ Requirements

- **Node.js 20+** and **pnpm 10+** (the project is pnpm-only: `npm`/`yarn` fail by `engine-strict`)
- **Deno 2** (to run the server locally and to deploy)

## 🔑 Environment variables

Build-time variables (read by Vite, reach the client by design):

```bash
# ---- TMDB (required: catalog, images and search) ----
# https://www.themoviedb.org/settings/api
VITE_TMDB_API_KEY=
VITE_TMDB_BEARER_TOKEN=

# ---- Vimeus (player) ----
# https://vimeus.net/settings/general
VITE_VIMEUS_VIEW_KEY=
```

Server-only variable (read only by `server.ts`, never in the bundle):

```bash
# Set as a Deno environment variable, not in any committed file.
VIMEUS_API_KEY=
```

What each one is for:

| Variable | Read by | Reaches the client? | Purpose |
| --- | --- | --- | --- |
| `VITE_TMDB_BEARER_TOKEN` | Vite (build) | Yes | Authorizes calls to the TMDB API |
| `VITE_TMDB_API_KEY` | Vite (build) | Yes | Reserved for v3 endpoints that use `api_key` |
| `VITE_VIMEUS_VIEW_KEY` | Vite (build) | Yes, by design | Required parameter of every embed URL; the player validates it by referrer |
| `VIMEUS_API_KEY` | Deno server | **No** | Authenticates `/api/listing/*` with the `X-API-Key` header |

Vite only injects variables with the `VITE_` prefix into the bundle.
`VIMEUS_API_KEY` intentionally has no such prefix: it is read from the Deno
environment by `server.ts` and never serialized to the frontend.

## 🧑‍💻 Development

```bash
pnpm install

# Frontend only (Vite dev server)
pnpm dev

# Full stack: build + serve through the Deno server (includes the /api proxy)
pnpm build
deno task start
```

## 📦 Deploy

Publish from the Deno Deploy dashboard or with the CLI:

```bash
pnpm install
pnpm build
deployctl deploy --project=<name> server.ts
```

Set `VIMEUS_API_KEY` as an environment variable of the deployment project.
The server serves the static files from `./dist` and proxies
`/api/vimeus/listing/*` to `vimeus.net` with the `X-API-Key` header.
`GET /healthz` returns `ok` for health checks.

## 🗂️ Project structure

```
Vumies/
├── server.ts                # Deno entry: serves dist/ + proxies /api/vimeus/listing/*
├── deno.json                # Deno tasks (dev, start)
├── src/                     # Vue 3 frontend
│   ├── core/                # config, router, stores and shared utilities
│   │   ├── config/          # API_CONFIG (TMDB, Vimeus, features)
│   │   └── stores/          # Pinia (app, settings, anime)
│   └── modules/
│       ├── catalog/         # TMDB catalog (movies, series, anime)
│       ├── player/          # player: Vimeus embed + listing proxy client
│       │   ├── services/    # vimeus.service (embeds) · vimeus.api (same-origin proxy client)
│       │   └── sources/     # StreamSource registry (vimeus iframe source)
│       └── ...
├── api/                     # Unused FastAPI module for the anime section (disabled)
└── odd/tasks/               # work documents (specs and tasks)
```

## 🎯 APIs used

### TMDB

- Movie and series metadata, images, search and recommendations
- [TMDB documentation](https://developer.themoviedb.org/docs)

### Vimeus (`vimeus.net`)

- **Embeds** (`view_key` required): `https://vimeus.net/e/movie`, `/e/serie`, `/e/anime`
  with `imdb` or `tmdb`, plus optional `se`/`ep` for series and anime
- **Listings** (require `X-API-Key`, 50 results per page):
  `https://vimeus.net/api/listing/movies`, `/series`, `/animes`, `/episodes`
- `poster`/`backdrop` URLs are relative TMDB paths: concatenate with
  `https://image.tmdb.org/t/p/original`
- Iframes are always inserted with `referrerpolicy="origin"`

`vimeus.com` is not a valid embed domain: the app exclusively uses `vimeus.net`.

## 🌐 Main routes

- `/` — Home
- `/movies` · `/movie/:id` — Movies
- `/series` · `/serie/:id` — Series
- `/player/:type/:id/:season?/:episode?` — Player
- `/search` — Search
- `/favorites` · `/recent` — Favorites and recently watched
- `/settings` — Settings

The anime module (`/animes`, `/anime/:slug`, `/ver-anime/:slug/:episode`) is disabled by
the `__ANIME_ENABLED__` flag in `vite.config.ts`.

## 📝 Scripts

```bash
pnpm dev            # Vite dev server (browser only)
pnpm build          # vue-tsc + production build to dist/
pnpm type-check     # Type checking without emitting
deno task start     # Serve dist/ + the Vimeus API proxy (requires pnpm build first)
deno task dev       # Same with --watch for server.ts
```

## 🎨 Color palette

- **Primary**: `#EE5E53` (coral red)
- **Dark**: `#1D1D1D`
- **Accent**: gray variations and transparencies

## 📄 License

MIT.
