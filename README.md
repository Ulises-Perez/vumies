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
