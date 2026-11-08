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

## 🛠️ Requirements

- **Node.js 20+** and **pnpm 10+** (the project is pnpm-only: `npm`/`yarn` fail by `engine-strict`)
- **Deno 2** (to run the server locally and to deploy)

## 🔑 Environment variables

Build-time variables (read by Vite, reach the client by design):

```bash
# ---- Vimeus (player) ----
# https://vimeus.net/settings/general
VITE_VIMEUS_VIEW_KEY=
```

Server-only variables (never in the bundle):

```bash
# Read by the Vite dev proxy and by `server.ts`. No `VITE_` prefix on purpose.
# https://www.themoviedb.org/settings/api -> API Read Access Token (v4 auth)
TMDB_BEARER_TOKEN=

# Read only by `server.ts` on Deno Deploy.
VIMEUS_API_KEY=
```

What each one is for:

| Variable | Read by | Reaches the client? | Purpose |
| --- | --- | --- | --- |
| `VITE_VIMEUS_VIEW_KEY` | Vite (build) | Yes, by design | Required parameter of every embed URL; the player validates it by referrer |
| `TMDB_BEARER_TOKEN` | Vite dev proxy + Deno server | **No** | Authorizes `/api/tmdb/*`, which both proxies forward as `Authorization: Bearer` |
| `VIMEUS_API_KEY` | Deno server | **No** | Authenticates `/api/listing/*` with the `X-API-Key` header |

No credential other than the Vimeus view key ever enters the bundle. The view
key is unavoidable: the provider requires it as a query parameter of the embed
URL, so it is visible in the iframe `src` by design. The TMDB token and the
Vimeus API key stay in the server and are reached only through same-origin
proxies (`/api/tmdb/*`, `/api/vimeus/listing/*`).

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

Set `VIMEUS_API_KEY` and `TMDB_BEARER_TOKEN` as environment variables of the
deployment project. The server serves the static files from `./dist`, proxies
`/api/vimeus/listing/*` to `vimeus.net` with the `X-API-Key` header, and
proxies `/api/tmdb/*` to `api.themoviedb.org/3` with the TMDB bearer.
`GET /healthz` returns `ok` for health checks.

## 🗂️ Project structure

```
Vumies/
├── server.ts                # Deno entry: serves dist/ + proxies /api/vimeus/listing/* and /api/tmdb/*
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
- Requests go through the same-origin `/api/tmdb/*` proxy, which adds the
  bearer server-side; the browser never holds the token
- Poster and backdrop images come straight from the public `image.tmdb.org`
  CDN, which needs no credential
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
pnpm dev            # Vite dev server (browser only, dev proxy adds the TMDB bearer)
pnpm build          # vue-tsc + production build to dist/
pnpm type-check     # Type checking without emitting
deno task start     # Serve dist/ + both API proxies (requires pnpm build first)
deno task dev       # Same with --watch for server.ts
```

## 🎨 Color palette

- **Primary**: `#EE5E53` (coral red)
- **Dark**: `#1D1D1D`
- **Accent**: gray variations and transparencies

## 📄 License

MIT.
