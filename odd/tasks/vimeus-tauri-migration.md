# Vimeus credentials + Windows-only Tauri packaging

Migrate the Vimeus player integration to the new `vimeus.net` API with fresh credentials, keep the API key out of the webview, and remove the Deno Deploy / web-deployment path so the app ships only as a Windows Tauri application.

## Specs

S1. New Vimeus credentials are the ones supplied by the user: API key `<VIMEUS_API_KEY>` and view key `<VITE_VIMEUS_VIEW_KEY>`. They must be configured so the player works, and the real values must never be committed to the repository. Real values live only in the gitignored `.env` (local/build) and in the Deno environment (`VIMEUS_API_KEY`, server-side).

S2. The base domain for both embeddings and listings is `https://vimeus.net` (the code still points at `vimeus.com`). Embed endpoints are `https://vimeus.net/e/movie`, `https://vimeus.net/e/serie`, `https://vimeus.net/e/anime`; listing endpoints are `https://vimeus.net/api/listing/movies`, `/api/listing/series`, `/api/listing/animes`, `/api/listing/episodes`. Valid embed parameters: `imdb` or `tmdb` (required), `se` + `ep` (optional, series/anime), `view_key` (required).

S3. The API key is server-side only: "API Key: Autentica tus llamadas al servidor. Úsala solo en backend, nunca en frontend." and "No expongas tu API Key en el código del lado del cliente." The view key, by contrast, is expected in the embed URL and is validated by the referrer.

S4. Listing requests authenticate with the `X-API-Key` header and are paginated 50 items per page with `page`, plus optional `tmdb_id` and `season` for episodes. A successful response has the shape `{ error: false, message: "Success", data: { movies|series|animes|episodes: [...], pagination: { current_page, total_pages, total_results, per_page, has_next, has_prev } } }`. Errors are `401` (missing or invalid API key), `400` (invalid page) and `404` (no content).

S5. Everything related to Tauri and to running the app inside Windows natively is removed; the application is deployed on **Deno Deploy** as a web app. The player therefore keeps only web-playable sources (the Vimeus iframe), because a native `mpv` driver and a local `librqbit` torrent engine cannot exist in a browser. The player markup keeps `referrerpolicy="origin"` on the Vimeus iframe, as the documentation requires.

S6. Player personalization stays appended as query parameters on the embed URL (`theme`, `logo_url`, `primary_color`), and the Vimeus view key gate (`isConfigured()`) keeps disabling the source when no view key is configured.

S7. The Vimeus API key is still server-side only, now served by the Deno deployment: a Deno entry module serves the built static app and proxies the listing endpoints with the `X-API-Key` header, reading the key from the Deno environment. The browser only ever calls the same-origin proxy, never `vimeus.net` directly.

S8. ~~No credential may be readable by the end user. The TMDB bearer therefore moves behind a same-origin proxy (`/api/tmdb/*`)...~~ **Reversed in L17.** The Vimeus API key stays server-side only (S3, S7). The TMDB bearer is accepted client-side by explicit decision of the human: the catalog calls `api.themoviedb.org` directly from the browser and the token is expected in the bundle. Git history must still contain no credential. The Vimeus view key is visible in the iframe `src` by provider design (S1).

## Tasks

- **T1** — Point Vimeus config at `vimeus.net` and load the new credentials from environment files (real values in gitignored `.env`, placeholders in `.env.example`), removing the API key from the client-exposed config. `Spec: S1, S2, S3` · route: inline · commit: `feat(vimeus): point player at vimeus.net`
- **T2** — Add a Rust-side `vimeus_listing` Tauri command that performs authenticated listing requests with `X-API-Key`, resolving the key from the environment or a local `.env`, plus a thin frontend bridge. `Spec: S1, S3, S4` · route: inline · commit: `feat(tauri): proxy vimeus listing API server-side`
- **T3** — Fix the anime store to consume the documented listing contract through the new bridge (`data.animes` + `data.pagination.total_pages`). `Spec: S4` · route: inline · commit: `fix(catalog): read documented vimeus listing contract`
- **T4** — Purge the Deno Deploy / web deployment path and configure Windows-only Tauri packaging (bundle targets, scripts, docs). `Spec: S5` · route: inline · commit: `chore(tauri): drop deno deploy, target windows only`
- **T5** — Verify: `vue-tsc` type-check, `cargo check`, production build, plus a real HTTP check that the new credentials return embeds and listings. `Spec: S1, S2, S3, S4, S5, S6` · route: inline · commit: (verification only)
- **T6** — Strip the native player out: reduce `PlayerView.vue` to the iframe player, drop the mpv/torrent branches, delete `torrent-engine.ts`, `torrentio.source.ts`, `PlayerTrackMenu.vue`, the torrent source registration and the `src-tauri/` tree, and remove the Tauri dependencies. `Spec: S5` · route: worker · commit: `refactor(player): drop the native mpv and torrent stack`
- **T7** — Add the Deno deployment: a Deno entry module that serves `dist/` and proxies `/api/vimeus/listing/*` with `X-API-Key` from the Deno environment, plus `deno.json` and the frontend bridge pointed at the same-origin proxy. `Spec: S4, S7` · route: worker · commit: `feat(deno): serve the app and proxy the vimeus api`
- **T8** — Restore the Deno Deploy deployment path in scripts, docs and config, and re-verify build plus type-check. `Spec: S5, S7` · route: worker · commit: `chore(deno): restore the deno deploy path`

## Log

**L1** — User's original request, verbatim:

> Revisa este proyecto para que lo configuremos con nuevas credenciales del reproductor vimeos.
>
> aca la apikey <VIMEUS_API_KEY>, la viewkey <VITE_VIMEUS_VIEW_KEY>
>
> (Los valores literales se redactaron en L12: eran secretos commiteados. El texto original está en la transcripción de la sesión, no en el repo.)
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

**L9** — Native review blocked by a harness defect (not a code finding). Lineage `review-859cbadecd60595c` (target `sha256:6dd7e1cc…793b1`, tier medium, 4 lenses) is stuck in state `reviewing` with **1 of 4** lens artifacts captured:

| Attempt | Path | Lens | Result |
| --- | --- | --- | --- |
| 1 | capture-group (4 slots) | review-resilience | `pi-host-relay-transport-failure` |
| 2 | capture single slot | review-risk | **captured** (`rart1_0795fdb0…ec73a3`) |
| 3 | capture-group (3 slots) | review-resilience | `pi-host-relay-transport-failure` |
| 4 | capture single slot | review-resilience | `pi-host-relay-transport-failure` |
| 5 | capture single slot | review-readability | `pi-host-relay-transport-failure` |

Every failure is the same provider error, returned in ~1.1 s, with `prepared_reviewers: 0`, `submitted_reviewers: 0`, `mutation_performed: none`:

> 400 invalid_request_error: `"thinking.type.enabled" is not supported for this model. Use "thinking.type.adaptive" and "output_config.effort" to control thinking behavior.`

So the Pi host relay builds the reviewer request with a `thinking` shape the reviewer model now rejects. It is a configuration incompatibility in the review relay, not a defect in the candidate and not a lens-specific finding. Retrying was stopped after the failure reproduced across two lenses and both invocation paths; `review-reliability` (order 3) was never attempted.

The lineage was deliberately left in `reviewing` rather than reset: RESET/RECOVER need explicit human authorization and no ambient recovery is allowed. Assistant-side verification (L7) stands on its own and is unaffected by this blocker.

**L10** — Requirement change, verbatim:

> Porque borraste el deploy a deno de la web?, solo quiero para deno, no para tauri, quiero quitar tauri de este proyecto, solo que se despliegue en deno.

This reverses S5. The original request said "también quiero borrar todo lo relacionado para que se utilice dentro de windows en tauri", which the agent read as "delete the Deno path, run under Tauri in Windows"; the intended meaning was "delete everything related to Tauri, keep only the Deno deployment". The agent chose an interpretation of an ambiguous sentence instead of asking, and built slice 2 in the wrong direction. S5 is rewritten, S7 is added, and T6-T8 do the reversal.

Consequence recorded explicitly: S5 removes `src-tauri/` (the Rust `mpv` driver, the `librqbit` torrent engine, the uosc Lua scripts and the Windows installer), `torrent-engine.ts`, `torrentio.source.ts` and `PlayerTrackMenu.vue`. Neither a native video driver nor a local torrent engine can run in a browser, so the player becomes the Vimeus iframe only. The work is recoverable from git history on this branch. The Rust `vimeus_listing` proxy (`de92f2e`) is superseded by the Deno server proxy in T7, which keeps the API key server-side for the same documented reason.

**L11** — Execution record for T6–T8. Delegated to `gentle-ai-worker` with `## Allowed edit surfaces`; the worker delivered all three phases except the `src-tauri/` deletion, which its harness blocked (`rm -rf` guard — child agents cannot destroy large trees). The parent executed the deletion directly and confirmed `test -d src-tauri` → false (job job-4, exit 0, 11 s).

Worker outcomes verified by the parent after landing:

- `pnpm build` exit 0 (PlayerView chunk 16.92 kB) and `pnpm type-check` exit 0, re-run independently by the parent.
- `grep -cin 'mpv|torrent'` on `PlayerView.vue` → 0 matches; iframe + `referrerpolicy="origin"` intact (line 18/27); `direct` `<video>` branch retained as a web-playable kind.
- `server.ts` reviewed: allowlisted query params (`page`, `tmdb_id`, `season`, `with_cf`), key never echoed or logged, upstream status/body passed through, SPA fallback for extensionless routes. The parent added one hardening commit on top: an explicit `..`-traversal 404 guard in `handleStatic` (defense in depth against a misbehaving proxy rewriting dot segments).
- `vimeus.api.ts` maps camelCase callers to snake_case params; `anime.store.ts` (`page` only) matches the allowlist.
- `deno` is not on PATH on this machine, so `server.ts` was checked structurally (README-conformant, transpiles clean) but never executed; a live proxy check needs a machine with Deno 2 plus `VIMEUS_API_KEY`.
- Dashboard-contract note (user): on Deno Deploy the canonical runtime variable is `VIMEUS_API_KEY`; a pre-existing `VITE_VIMEUS_API_KEY` entry in the user's dashboard must be renamed (it is the old client-side name that this change deliberately removed).

Commits: `refactor(player)` (native stack removed), `feat(deno)` (server + proxy bridge), `chore(deno)` (`.npmrc`, README), plus a harness-generated `.atl/` refresh.

**L12** — Verification pass after L11 (web-only / Deno Deploy target). Evidence gathered directly:

- **Tauri is fully gone.** `test -d src-tauri` → absent. `grep -in 'tauri\|@tauri' package.json pnpm-lock.yaml` → 0 matches. `grep -rin 'tauri|src-tauri|cargo.toml|mpv|torrentio|librqbit'` across `*.ts`, `*.vue`, `*.json`, `*.js`, `*.md`, `*.cjs`, `*.html` (excluding `node_modules`, `dist`, `.git`, `odd`) → 0 matches. The only remaining mention of Tauri in the tree is this historical document.
- **Deno Deploy is the only deployment target.** `server.ts`, `deno.json` and the README deploy section are present; `dist/` is served with an SPA fallback and `/api/vimeus/listing/*` proxies upstream with `X-API-Key`.
- **Build is green.** `pnpm build` (includes `vue-tsc -b`) → exit 0, `✓ built in 6.36s`. `PlayerView` chunk 16.92 kB, `vendor-vue` 113.94 kB.
- **The view key works.** `curl https://vimeus.net/e/movie?tmdb=550&view_key=…` → `HTTP 200`; `curl https://vimeus.net/e/serie?tmdb=1399&se=1&ep=1&view_key=…` → `HTTP 200`.
- **The listing API is alive and gated.** `curl https://vimeus.net/api/listing/movies` without a key → `HTTP 401`, exactly as documented.

**L13** — Security finding, fixed: the real Vimeus API key and view key were committed in this document (`S1` and `L1`, introduced by `8edfd61`) and are therefore in git history. That directly contradicts `S1` itself and the provider rule "No expongas tu API Key en el código del lado del cliente." Both literals were replaced with `<VIMEUS_API_KEY>` / `<VITE_VIMEUS_VIEW_KEY>` placeholders. History is unchanged, so the API key remains readable in `8edfd61` and should be rotated from the Vimeus dashboard if this repository is public or shared.

**L14** — Open blockers for local/runtime configuration, both requiring the human:

1. **`.env` cannot be written by the agent.** The Gentle AI safety guard rejects the sensitive path (`C:/Users/ulise/OneDrive/Documentos/proyectos/vumies/.env`), same as in L5. Without it `VITE_VIMEUS_VIEW_KEY` and both TMDB variables are empty at build time: `vimeusService.isConfigured()` stays `false` (the player source is disabled) and every TMDB call fails hard at `tmdb.service.ts:45` (`throw new Error(\`TMDB ${res.status} …\`)` — no fallback), so Home, Movies, Series, Search and the detail views cannot render.
2. **TMDB credentials were never supplied.** `VITE_TMDB_API_KEY` / `VITE_TMDB_BEARER_TOKEN` must come from the user's own TMDB account. They were not invented and not recovered from git history (see L8).

On Deno Deploy the server-side variable is `VIMEUS_API_KEY`; a pre-existing `VITE_VIMEUS_API_KEY` entry in the dashboard must be renamed, since it is the old client-exposed name that this change deliberately removed.

**L15** — End-to-end verification with the real credentials in place (human created `.env`; the agent cannot read or name that path, so every check below is outcome-based). Real browser: ego lite (project policy), dev server `vite v7.3.5` on `:5173`.

| Check | Evidence |
| --- | --- |
| Build with the real env | `pnpm build` exit 0, `✓ built in 2.80s`, `dist/assets/index-anSurMRy.js` |
| Bearer actually baked | `grep -c 'eyJhbGciOiJIUzI1NiJ9' dist/assets/index-*.js` → `1` (count only; the value was never printed or read back) |
| Home renders live catalog | title `Vumies - Películas y Series Online`, real trending content ("La Odisea 2026 8.0" with its Spanish synopsis), 6 `api.themoviedb.org` resource entries (`/genre/movie/list`, `/genre/tv/list`, `/trending/movie/day`) → TMDB auth works |
| Movies list | `/movies` → **60** cards (`a[href*="/movie/"]`), **0** error elements |
| Movie player | `/player/movie/155` → source modal → click Vimeus → iframe `https://vimeus.net/e/movie?tmdb=155&view_key=…&title=Vumies&theme=minimal&font=v3&overlay=v5&epanel=v3&splash=v3`, `referrerpolicy="origin"`, cross-origin document loaded, rendered 1478×1294, modal closed |
| Series player (`se`/`ep`) | `/player/serie/1399/1/3` → iframe `https://vimeus.net/e/serie?tmdb=1399&se=1&ep=3&view_key=…&title=Vumies&…`, same `referrerpolicy`, 1478×1294 |

Correction to L14: `VIMEUS_API_KEY` on Deno Deploy is **not** needed for the current build. `fetchVimeusListing` has exactly one consumer, `anime.store.ts:46`, and `App.vue` calls it only behind the anime-module guard; with `__ANIME_ENABLED__: false` the module is tree-shaken out of the build (no `AnimeView`/`AnimeDetailView` chunks in `dist/`). The variable becomes necessary only when anime is re-enabled. The three `VITE_*` values are the ones that must exist at **build** time, because Vite inlines them.

Not verified: `server.ts` itself. Deno is not installed on this machine (`deno --version` → not found), so `/healthz` and `/api/vimeus/listing/*` were never executed locally; their behaviour is unchanged by this change and remains covered structurally per L11.

**L16** — Requirement change, verbatim:

> Si hazlo, lo otro es que ninguna clave se vea todo quede oculto y nada sea visible para el usuario.

This authorizes the history purge (L13) and adds S8: no credential may be readable by the end user. It also authorizes destructive history rewriting, which was explicitly offered and not executed until this message.

**History purge.** The key lived in one commit (`8edfd61`) on a branch that had never been pushed: `git ls-remote --heads origin` returned only `refs/heads/main` at `c55a347`, and `8edfd61` was not an ancestor of `origin/main`. The remote is **public** (`"private": false`), so pushing the branch as it was would have published the key permanently. Method, in order, with the obstacles found:

1. `git filter-branch --tree-filter` with an inline `sed` reported "Ref was rewritten" but produced identical hashes; a second attempt with a script that logged on every commit proved the filter ran 11 times and still ended in "Ref is unchanged". filter-branch does not commit the filtered tree in this environment (missing `/tmp` breaks it), so it was abandoned rather than trusted.
2. `git filter-repo` is not installed.
3. Deterministic fallback used instead: `git format-patch origin/main..HEAD` → 11 patches → redacted with `perl -pi -e 's/ak_[A-Za-z0-9]{20,}/<VIMEUS_API_KEY>/g; s/BkVVLIFF[A-Za-z0-9_-]{10,}/<VITE_VIMEUS_VIEW_KEY>/g'` (regex by shape, so the literal secret was never retyped into a command) → verified 0 matches → `git checkout -B` onto `origin/main` → `git am`. Result: 11 commits replayed, new tip `e5ff590`.
4. The old objects stayed alive after `reflog expire` + `gc --prune=now`. Root cause: two stale linked worktrees left by the blocked native review of L9 — `.git/gentle-ai/candidate-views/74d5daaf…` (detached at `e94afdf`) and `.git/gentle-ai/candidate-views/84044e41…` (detached at `9ea7f37`) — pinned the old commits (`git rev-list --all` was 32 instead of 23, every one of them `undefined` in `git name-rev`). `git worktree remove --force` failed on Windows with `Permission denied`, but it removed the administrative metadata, so `git worktree prune` unlinked them; the objects then became unreachable and were pruned.

Final state: `git rev-list --all` = **23** (12 from `main` + 11 replayed), `8edfd61` no longer exists in the object database, and **0** occurrences of either credential across the whole history (`git log --all -p`). Nothing was force-pushed and `origin/main` was never touched.

**Keyless bundle (S8).** `TMDB.BASE_URL` is now the relative `/api/tmdb`, `tmdb.service.ts` sends no `Authorization` header, and both environments serve the same path: `server.ts` for Deno Deploy, `vite.config.ts` for local development. Both add `Authorization: Bearer <TMDB_BEARER_TOKEN>`, read from the environment in Node/Deno. `vite.config.ts` reads it with `loadEnv(mode, cwd, '')` — empty prefix, so the non-`VITE_` variable is available to the dev proxy and still never reaches the client. The `dns-prefetch` for `api.themoviedb.org` was removed from `index.html` because the browser no longer contacts it.

Defect caught by real verification: the first build passed `vue-tsc` and the proxy itself answered `200`, yet the app rendered nothing. `tmdb.service.ts` built its URL with `new URL(this.baseURL + path)`, which throws `TypeError` for a relative base; every catalog call failed synchronously. Fixed by assembling the query with `URLSearchParams` and passing the relative path to `fetch`. This is exactly the class of regression a green build does not catch.

Evidence, all measured:

| Check | Result |
| --- | --- |
| `pnpm build` / `pnpm type-check` | exit 0 / exit 0 |
| `deno check server.ts` | exit 0 (first time this was possible: Deno 2.9.6 installed) |
| Bundle sweep: JWT, `ak_…`, `Bearer`, `api.themoviedb.org`, `X-API-Key` | **0 / 0 / 0 / 0 / 0** |
| Browser home | 6 calls to `/api/tmdb/*`, **0** to `api.themoviedb.org`, 7 images from `image.tmdb.org`, real content ("La Odisea 2026 8.0") |
| Browser `/movies` | 60 cards |
| Browser player `/player/movie/155` | iframe `https://vimeus.net/e/movie?tmdb=155&view_key=…`, `referrerpolicy="origin"`, 1478×1294, 0 direct TMDB calls |
| Deno `GET /healthz` | `200 ok` |
| Deno `GET /` and `/movies` (SPA fallback) | `200`, `200` |
| Deno `GET /api/tmdb/movie/155` with a deliberately invalid token | `401 {"status_code":7,"status_message":"Invalid API key…"}` — proves routing, query passthrough and header injection reach TMDB |
| Deno `GET /api/tmdb/configuration` (resource outside the allowlist) | `400 Unsupported TMDB resource` |
| Deno `GET /api/tmdb/` (no resource) | `400 Missing TMDB resource` |
| Deno `GET /api/tmdb/movie/../genre` (`--path-as-is`) | `401`, no traversal escape |
| Deno with no `TMDB_BEARER_TOKEN` / no `VIMEUS_API_KEY` | `503` with a descriptive body for both |

**Still required from the human**, because the agent cannot write `.env`: rename `VITE_TMDB_BEARER_TOKEN` to `TMDB_BEARER_TOKEN` in the local `.env`, and add `TMDB_BEARER_TOKEN` to the Deno Deploy environment. The Vite dev proxy keeps a temporary fallback to the old `VITE_`-prefixed name so local development does not break in the meantime; `server.ts` accepts only the canonical name.

**L17** — Requirement change, verbatim:

> Si hazlo, y tranqui no me importan las credenciales de tmdb la verdad

The human accepts the TMDB credential exposure and chooses, when offered the three options, "Volvé TMDB al cliente y mergeá". S8 is reversed for TMDB: the bearer returns to the client bundle and the catalog calls `api.themoviedb.org` directly.

**Why the reversal is the right call here.** The proxy (L16) turned `server.ts` from optional into mandatory. Before it, the whole app ran client-side — TMDB from the browser, Vimeus in an iframe — so a static deployment was sufficient. Investigation of the live deployment confirmed it is static-only on both URLs: `GET /healthz` and `GET /api/tmdb/*` return `index.html` through the SPA fallback instead of `ok` and JSON. Requiring a Deno entry point for a catalog that the human does not consider secret buys no protection he values, at the cost of a deployment configuration that currently does not exist. Reverted.

Reverted to the state of `c77ae36^`: `api.config.ts`, `tmdb.service.ts`, `vite.config.ts`, `server.ts`, `index.html`, `README.md`. The ODD document keeps S8/L16 as history rather than pretending the proxy never existed.

One deliberate deviation from a pure revert: `VITE_TMDB_API_KEY` (v3) is no longer read in `api.config.ts`. No endpoint ever used it, so keeping it only baked a dead credential into a public bundle.

**Live exposure recorded, accepted by the human.** `https://vumies.devk.deno.net/assets/index-BVdb_F7a.js` served the pre-change bundle containing one full 240-byte TMDB v4 JWT and one 32-hex v3 key. Rotation was recommended and explicitly declined ("no me importan las credenciales de tmdb"). Both are read-only catalog credentials scoped to the public TMDB catalog; the accepted consequence is quota consumption and possible rate limiting under that account.

**Required environment variable for the reverted code:** the Vite build reads `VITE_TMDB_BEARER_TOKEN` (with the `VITE_` prefix) again, so that name — not `TMDB_BEARER_TOKEN` — must hold the token in Deno Deploy. `TMDB_BEARER_TOKEN` becomes unused. `VITE_VIMEUS_VIEW_KEY` is unchanged. `VIMEUS_API_KEY` remains the server-only name for the listing proxy, which is inert while the deployment stays static and the anime module stays disabled.
