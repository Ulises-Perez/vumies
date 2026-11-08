# Vimeus credentials + Windows-only Tauri packaging

Migrate the Vimeus player integration to the new `vimeus.net` API with fresh credentials, keep the API key out of the webview, and remove the Deno Deploy / web-deployment path so the app ships only as a Windows Tauri application.

## Specs

S1. New Vimeus credentials are the ones supplied by the user: API key `<VIMEUS_API_KEY>` and view key `<VITE_VIMEUS_VIEW_KEY>`. They must be configured so the player works, and the real values must never be committed to the repository.

S2. The base domain for both embeddings and listings is `https://vimeus.net` (the code still points at `vimeus.com`). Embed endpoints are `https://vimeus.net/e/movie`, `https://vimeus.net/e/serie`, `https://vimeus.net/e/anime`; listing endpoints are `https://vimeus.net/api/listing/movies`, `/api/listing/series`, `/api/listing/animes`, `/api/listing/episodes`. Valid embed parameters: `imdb` or `tmdb` (required), `se` + `ep` (optional, series/anime), `view_key` (required).

S3. The API key is server-side only: "API Key: Autentica tus llamadas al servidor. Úsala solo en backend, nunca en frontend." and "No expongas tu API Key en el código del lado del cliente." The view key, by contrast, is expected in the embed URL and is validated by the referrer.

S4. Listing requests authenticate with the `X-API-Key` header and are paginated 50 items per page with `page`, plus optional `tmdb_id` and `season` for episodes. A successful response has the shape `{ error: false, message: "Success", data: { movies|series|animes|episodes: [...], pagination: { current_page, total_pages, total_results, per_page, has_next, has_prev } } }`. Errors are `401` (missing or invalid API key), `400` (invalid page) and `404` (no content).

S5. Everything related to Deno Deploy and the web deployment is removed; the application is used inside Windows with Tauri. The player markup keeps `referrerpolicy="origin"` on the Vimeus iframe, as the documentation requires.

S6. Player personalization stays appended as query parameters on the embed URL (`theme`, `logo_url`, `primary_color`), and the Vimeus view key gate (`isConfigured()`) keeps disabling the source when no view key is configured.

## Tasks

- **T1** — Point Vimeus config at `vimeus.net` and load the new credentials from environment files (real values in gitignored `.env`, placeholders in `.env.example`), removing the API key from the client-exposed config. `Spec: S1, S2, S3` · route: inline · commit: `feat(vimeus): point player at vimeus.net`
- **T2** — Add a Rust-side `vimeus_listing` Tauri command that performs authenticated listing requests with `X-API-Key`, resolving the key from the environment or a local `.env`, plus a thin frontend bridge. `Spec: S1, S3, S4` · route: inline · commit: `feat(tauri): proxy vimeus listing API server-side`
- **T3** — Fix the anime store to consume the documented listing contract through the new bridge (`data.animes` + `data.pagination.total_pages`). `Spec: S4` · route: inline · commit: `fix(catalog): read documented vimeus listing contract`
- **T4** — Purge the Deno Deploy / web deployment path and configure Windows-only Tauri packaging (bundle targets, scripts, docs). `Spec: S5` · route: inline · commit: `chore(tauri): drop deno deploy, target windows only`
- **T5** — Verify: `vue-tsc` type-check, `cargo check`, production build, plus a real HTTP check that the new credentials return embeds and listings. `Spec: S1, S2, S3, S4, S5, S6` · route: inline · commit: (verification only)

## Log

**L1** — User's original request, verbatim:

> Revisa este proyecto para que lo configuremos con nuevas credenciales del reproductor vimeos.
>
> aca la apikey <VIMEUS_API_KEY>, la viewkey <VITE_VIMEUS_VIEW_KEY>
>
> y la documentacion
>
> vimeus.net
>
> [Documentación de la API de Vimeus pegada en el mensaje. Pasajes normativos citados textualmente:]
>
> "Nota importante: Todas las peticiones Web Embeds requieren el parámetro view_key, el cual es único por usuario."
>
> "Dominios válidos para inserciones (Embeds)" → "vimeus.net"
>
> "Endpoint: https://vimeus.net/e/movie?view_key=..." · "Endpoint: https://vimeus.net/e/serie?view_key=..." · "Endpoint: https://vimeus.net/e/anime?view_key=..."
>
> "imdb o tmdb requerido" · "se — Número de temporada (opcional)" · "ep — Número de episodio (opcional)" · "view_key requerido"
>
> "Todos los endpoints de listado requieren autenticación mediante API Key. Debes incluir tu API Key en el header X-API-Key en cada solicitud."
>
> "Todos los endpoints de listado aceptan with_cf=true."
>
> "El límite de resultados por página es fijo en 50 elementos" · "Las URLs de imágenes (poster y backdrop) son rutas relativas de TMDB. Deben ser concatenadas con: https://image.tmdb.org/t/p/original"
>
> "API Key: Autentica tus llamadas al servidor. Úsala solo en backend, nunca en frontend."
>
> "View Key: Ya está incluida en el embed_url. Valida que el iframe se use solo en dominios permitidos."
>
> "Referrer Policy: Siempre usa referrerpolicy="origin" en tus iframes para validación correcta."
>
> "Todas las solicitudes requieren una API Key a través de X-API-Key. No expongas tu API Key en el código del lado del cliente."
>
> "También quiero borrar todo lo relacionado para que se utilice dentro de windows en tauri."
>
> (El texto completo de la documentación sigue disponible en la transcripción de la sesión.)

**L2** — Evidence (exploration, before any write): the repository has **no** `.env` file at all, so every `VITE_*` value in `src/core/config/api.config.ts` is empty and `vimeusService.isConfigured()` is `false` — the Vimeus source is currently disabled at runtime. `api.config.ts:9-10` points at `https://vimeus.com`, not `vimeus.net`. `anime.store.ts:63,68` reads the obsolete listing shape (`data.data.result`, `data.data.pages`) while `types/vimeus.types.ts` already declares the documented one (`data.animes`, `data.pagination.total_pages`). Deno Deploy survives only as prose: `.npmrc:5-8` (pnpm auto-provisioning comment) and `vite.config.ts:33` (chunk cache "entre deploys"); no `deno.json`, `deno.lock`, serverless function, CI workflow, `netlify.toml` or `vercel.json` exists in-tree. Tauri is already wired (`src-tauri/src/lib.rs:36-42` exposes `torrent_resolve`, `mpv_play`, `mpv_set_geometry`, `mpv_command`, `mpv_stop`) and `src-tauri/Cargo.toml` has no HTTP client dependency, only an axum server for local torrent streaming. `.atl/skill-registry.md:1` is titled "Vumies Deno" and `.env*` is ignored by `.gitignore:29-31`.

**L3** — Decision: the API key must not reach the webview bundle, so the authenticated listing calls move to a Rust Tauri command (`reqwest`, already-available cargo 1.99.1) that resolves the key at runtime from the process environment, a `.env` next to the executable, the app config directory, or the repository root during development. The view key stays client-side because the documentation defines it as an embed-URL parameter validated by the referrer. This also removes the cross-origin `fetch` to `vimeus.net` that the Tauri webview cannot perform.

**L4** — Decision: the legacy player-personalization parameters (`font`, `overlay`, `epanel`, `splash`) are kept as-is to avoid changing the app's visual identity; only the documented `theme`, `logo_url` and `primary_color` are treated as contractual.

**L5** — Blocked by policy: the Gentle AI safety guard denied writing `.env` and `.env.example` (`sensitive path`). The real credentials were therefore **not** written by the agent; the wiring is complete and the human must create the file. No workaround (shell redirection, alternate filename, `setx` with the literal key) was used, because persisting a secret into a new location is the one hard line.

**L6** — Delivery strategy: `feature-branch-chain`, recorded here because the ask-on-risk delivery question cannot be answered in this session. Authored-lines counter reported 456 after `de92f2e` and 728 after `82d12a4`, so the change is split in review slices rather than one PR:

- **Slice 1 — Vimeus migration** (`8edfd61`, `de92f2e`): feature document, `vimeus.net` base URLs, client-side API key removed, Rust `vimeus_listing` proxy with its tests, anime store on the documented contract.
- **Slice 2 — Windows packaging** (`82d12a4`): Deno Deploy purge, NSIS-only bundle, pnpm scripts, README rewrite.

Both slices live on `feature/vimeus-tauri-migration`; slice 2 is chained on slice 1 and can be reviewed as a follow-up once slice 1 lands.

**L7** — Verification evidence: `pnpm build` (includes `vue-tsc -b`) exit 0; `pnpm type-check` exit 0; `cargo check --all-targets` exit 0 (only a pre-existing `function_casts_as_integer` warning in `mpv.rs:208`); `cargo test --lib vimeus` 2 passed; `curl https://vimeus.net/api/listing/movies` → `HTTP 401` (endpoint and auth gate live, no secret used); `curl https://vimeus.net/e/movie?tmdb=550` → `HTTP 200`. Still unproven end-to-end: an authenticated listing call and a real embed render, which need the credentials the guard prevented writing.

**L8** — Note for the human: `VITE_TMDB_BEARER_TOKEN` / `VITE_TMDB_API_KEY` were also empty before this change (no `.env` existed), so the catalog needs those values too, from the user's own TMDB account. They were not invented or recovered from git history.
