# Continue watching on the home route, and a sidebar that sits on the grid

Ship a "Continuar viendo" section on the home route that reopens what the person was watching
(movie, series or anime episode), built on the only progress signal that actually exists, and put
the sidebar on the same alignment contract as the rest of the layout.

## Specs

S1. The home route gets a "Continuar viendo" section that lists what the person opened recently,
newest first, and reopening an entry returns to that exact content — the same movie, or the same
season and episode for a series. Exact words: "hacer una nueva seccion en el inicio, que sera
continuar viendo, con esto lograr poder continuar viendo el contenido de movies o series".

S2. No invented progress. The section may only show what the app can prove. A percentage or a
"8 min left" line is forbidden unless a real position is available, and the investigation below says
it is not. Exact words: "continuar viendo el contenido", not "inventar progreso".

S3. The section disappears when there is nothing to continue; it never renders an empty rail or a
fake skeleton after the store is hydrated.

S4. The player records what it played. Opening the player for a movie records that movie; for a
series or anime it records the season and episode, so the entry resumes the episode and not the show.

S5. The sidebar is correctly aligned. Exact words: "alinear correctamente el sidebar". Its top edge
stays on the chrome line, its left edge sits on the page gutter, its bottom gap matches the space it
gives itself at the top, and its internal rhythm uses one number: section gaps equal, divider inset
like the rows, bottom padding equal to the top padding. Icons, labels and section headings keep the
three existing lines they already share.

S6. Nothing that works today stops working: every route, filter, favourite, history entry, settings
toggle, command palette and player embed keeps working; `vue-tsc` and `vite build` stay clean.

## Tasks

- **T1** — Sidebar alignment: panel on the gutter, symmetric vertical gaps, one rhythm inside.
  `Spec: S5` · route: inline
- **T2** — Store: history entries carry what is needed to resume (kind, tmdbId, season, episode) and a
  derived route. `Spec: S1, S4` · route: inline
- **T3** — Player records its content on mount (movie, series, anime) into history. `Spec: S4`
  · route: inline
- **T4** — `ContinueWatching.vue` rail on the home route, newest first, hidden when empty.
  `Spec: S1, S2, S3` · route: inline
- **T5** — Verify: type-check, build, real-browser checks (rail renders only with history, resume
  links land on the right route, sidebar geometry at 1440/1024/768/390), impeccable audit.
  `Spec: S5, S6` · route: inline

## Log

**L1** — Original request, verbatim:

> Quiero que uses rea, para investigar como funciona el reproductor vimeos o directamente el
> contenido, mediante vumies, esto para que podamos hacer una nueva seccion en el inicio, que sera
> continuar viendo, con esto lograr poder continuar viendo el contenido de movies o series, ademas de
> alinear correctamente el sidebar.

**L2** — REA investigation of the player chain, with artifacts saved under `temp/rea-vimeus/`
(`embed-movie.html`, `index-v2.js` 405 KB, `vimeos-embed.html` 52.9 KB). Findings:

1. **Three hops.** Vumies embeds `vimeus.net/e/<kind>?...&view_key=…`; that page answers with a JSON
   payload whose `embeds[].url` points at a **different host**, `vimeos.net/embed-<id>.html`, which is
   the actual video player (jwplayer-style, hls.js, Google IMA ads). Vumies only controls hop two.
2. **`vimeos.net` has a real bridge, but it is scoped to its own parent.** The page ships an inline
   `vidapiParentBridge` that posts to `window.parent` with `type: 'VIDAPI_PLAYER_EVENT'`,
   `source: 'vidapi-player'`, `event` (`bridge_ready`, `ready`, `play`, `pause`, `time` every 5 s,
   `seeked`, `ended`, `error`, `command_*`, `vip_consume_threshold`) and a snapshot
   `{ title, player_status ('completado'|'pausado'|'reproduciendo'), player_progress,
   player_duration, watch_seconds, muted, volume }`. It accepts
   `{ type: 'VIDAPI_PLAYER_COMMAND' | 'PLAYER_COMMAND', command, payload, request_id }` with
   `ping|getState|play|pause|toggle|seekBy|seekTo|seek|mute|unmute|volume`. **`seekTo` with
   `payload.seconds` is a real resume.**
3. **Why Vumies cannot use it as-is.** The bridge computes `parentOrigin` from a signed `cf` token
   (`pm`/`ao` allowlists) or `document.referrer`, refuses every other origin on both send and receive,
   and its parent is **vimeus**, not Vumies. `vimeus.net`'s own bundle (`index-v2.js`) contains no
   app-level `postMessage` at all (its only hit is minified React scheduler internals) and no
   `t`/`start` parameter forwarding, so no event reaches Vumies and no command crosses the shell.
   Embedding `vimeos.net` directly would not help either: with the `cf` allowlist in place the bridge
   posts to vimeus' origin, and without it `parentOrigin` resolves to `''` and the bridge disables
   itself.
4. **The position already exists, in their storage.** The same page persists the playhead to its own
   localStorage (`time_<file_id>`) and, on load, reads a `t=` URL parameter into it and shows its own
   resume modal (`checkResumeTime`, `showResumeModal`). So **reopening the same content resumes
   playback inside the player**, with no integration from us — we just cannot read or display the
   number.

Conclusion recorded instead of invented: "Continuar viendo" is built on the app's own history and
reopens the exact content, which triggers the player's own resume. No percentage, no remaining-time
line, no client-side timer pretending to be progress. Real position display would require vimeus to
whitelist our origin in the `cf` token (or forward the bridge), which is their change, not ours.

**L3** — Sidebar measured before touching it (1440, sidebar open): panel `x 3, w 280, y 64, h 824`
against a content gutter of `48`; nav rows at `x 12, w 262`; icons at `x 24`; labels at `x 56`. So the
panel's left edge sits 45px left of the grid it is supposed to share, and a vision review of the
rendered frame adds what numbers cannot: the bottom gap (13px) does not match the top gap (64px), the
top bar's `✕` and wordmark do not share a line with the panel's icon column, section gaps inside the
panel measure 27/19/24px, the divider above the last section is full-bleed while the rows are inset,
and the top padding (27px) is not the bottom padding (8px).

**L4** — Implemented and verified.

- **T1, sidebar.** Panel edges moved onto the contract: `top: var(--chrome-top)`, `left` and `bottom:
  var(--gutter)`, width `17.5rem`, and one inner padding (`12px`) in both blocks instead of `px-2
  pt-2 pb-2` against `px-2 pt-1 pb-2`. The divider above the pinned group is inset (`mx-3`) instead of
  full-bleed, and `.nav-group-label` uses one number per group (`1.125rem` above, `0.375rem` below,
  first group `0.375rem`). Measured after: panel `x 48` at 1440 and `x 16` at 390 — exactly the page
  gutter — with `bottom` gap `48`/`16`, `y 64` (`--chrome-top`), and the top bar's own toggle at
  `x 48`, so the panel and the bar finally share the leading line the vision review flagged as
  defect 2. Nav padding `12px`, row pitch `44px`, 0 px horizontal overflow.
- **T2, store.** `WatchHistoryItem` gained `kind: 'movie' | 'series' | 'anime'`, `season`, `episode`
  and `slug`. `kind` only exists when there was a real play, and the rail filters on it, so opening a
  detail page or a card never qualifies as "watching". Dedupe stays one row per title, so the newest
  episode replaces the older one — exactly what the rail should show.
- **T3, recording.** `MovieDetailView.playMovie()` and `SerieDetailView.playEpisode()` write the entry
  at the moment of play, carrying season and episode. Verified end to end: pressing "Reproducir" on
  `/movie/693134` writes `{ kind: 'movie', title: 'Duna: Parte dos' }` to `vumies_history`, and it
  survives a hard reload.
- **T4, the rail.** `ContinueWatching.vue` sits right after the mosaic on `/`, shows up to 12 entries
  newest first, 240/280px cards with the poster, the title and `Temporada N · Episodio M` for series,
  and links to `{ name: 'player' }`. Verified: fresh storage renders **no section** (4 rails, not 5);
  after a real play the section appears with heading `x 48` (on the gutter) and card href
  `/player/movie/693134`; a series entry renders "Breaking Bad · Temporada 2 · Episodio 5" and its
  href `/player/tv/1396/2/5` resolves to that exact route.

`vue-tsc` and `vite build` clean. Impeccable detector on `/` and `/history`: only the already-waived
`overused-font`. Not verified: the resume position itself inside the player (it is their origin and
their storage), and anime entries (the feature flag is off, so the route is unreachable in this build).

**L5** — Follow-up request: review the player at `/player/movie/969681` and find out whether
skip-intro/outro and automatic next-episode are possible, "desde donde traer esta informacion de
forma automatica y no manualmente".

1. **Player review (verified in the browser).** `/player/movie/969681` opens with the source picker,
   not with video: the `<iframe>` exists with an **empty `src`** and the modal says "Elige una
   fuente · VIMEUS EMBED · Vimeus". Clicking it loads
   `https://vimeus.net/e/movie?tmdb=969681&view_key=…&title=Vumies&theme=minimal&font=v3&overlay=v5&epanel=v3&splash=v3`
   at 1440x900 with `referrerpolicy="origin"`. So playback works, but a single available source still
   costs a click, and no `cf` token is present in that URL.
2. **The skip data exists, automatically.** Two community databases answer public reads with no key:
   - **IntroDB** `GET https://api.introdb.app/segments?imdb_id=tt0944947&season=1&episode=1` returns
     `outro {start_sec 3631.5, end_sec 3699.5, confidence 1, submission_count 2}`, `no_recap: true`,
     `no_intro: false`, and `intro: null` when nobody submitted one. It accepts imdb/tvdb/tmdb and
     `is_movie=true` for films.
   - **AniSkip** `GET https://api.aniskip.com/v2/skip-times/16498/1?types=op&types=ed&episodeLength=1420`
     returns `op {startTime 0, endTime 90}`, keyed by MAL id and episode.
   Verified with real responses for GoT S1E1 and AoT E1. No manual input is needed: null means "not
   submitted", not "ask the user".
   SponsorBlock is not usable here: it keys by video id and our stream is not a SponsorBlock video.
3. **What is still missing is the ability to act on that data.** Skipping needs `seekTo` (exists in
   the vimeos bridge) and auto-next near the end needs progress (also exists: `time` every 5 s with
   `player_progress`/`player_duration`), but both are gated to vimeus' origin (L2). The one documented
   route to authorize another origin is the listing API with `with_cf=true`, whose `embed_url` uses the
   `/cf/*` route plus a `cf` token. **Blocked here, not by design but by configuration:** the proxy
   (`server.ts`, already forwards `with_cf`) starts and listens on :8000, but answers
   `VIMEUS_API_KEY is not configured` in this environment, and the key lives in `.env`, which is
   private material this session must not read. The embed page does **not** mint a token by itself:
   requesting `https://vimeus.net/e/serie?tmdb=1399&se=1&ep=1&with_cf=true` (and `with_cf=1`) returns
   the same plain `https://vimeos.net/embed-uh1n724ozegr.html` with no `cf`.
4. **Not viable: our own player over their stream.** The manifest lives inside the vimeos iframe
   (hls.js + Google IMA). The documentation exposes embed URLs, not stream URLs; extracting a
   manifest would mean scraping their player internals — fragile against their releases and against
   the model the `cf` token exists to enforce. A player of our own (skip button, next-episode, our
   controls) presupposes the bridge or a licensed manifest, not a scrape.
5. **Rejected heuristic:** firing "next episode" from wall-clock time versus TMDB runtime. It breaks
   on pause, seek and buffering, so it would advance people mid-episode. No.

**L6** — Player review by actually playing it (ego lite, 1440x900, screenshots read by a reviewer that
can see them), plus the single-source fix.

- **Single-source click removed.** `loadContent()` now calls `selectStream()` when the resolved source
  list has exactly one entry and there is no remembered preference; two or more sources still open the
  picker, because there is something to choose. Verified: `/player/movie/969681` and
  `/player/tv/1396/2/5` both load their embed immediately (`/e/serie?tmdb=1396&se=2&ep=5&…`), no
  "Elige una fuente" modal.
- **The click that remains is the player's own, and not configurable.** The embed renders a full-bleed
  poster with a big play button and only starts video after a user gesture; the first click clears the
  poster into a black, still-loading frame and the second produces the stream (ads/autoplay policy).
  Tested `splash=v3` (current), `splash=0`, `splash=v1` and no `splash` parameter at all, each captured
  9 s after mounting an iframe with that URL and no clicks: **all four frames are the same poster with
  the same play button**, so the splash parameter changes nothing here and the gesture requirement is
  theirs, not ours.
- **Two real defects found by playing, not fixed yet** (they are design changes to the player chrome,
  so they need a decision): (1) the embed draws its own "Servidores 1" control at top-left, `x 16–176,
  y 17–52`, exactly over the app's round back button, and the chevron sits on the label; (2) the app's
  "Episodios" and "Fuentes" pills lose their dark surface once video is playing and become low-contrast
  text over a bright frame.
- **Confirmed working:** the episodes drawer (season selector, per-episode stills, titles, durations,
  ratings, clamped descriptions, scroll) highlights the episode being played (S2E5 "Rotura") with a
  distinct row, left border and play glyph; letterboxing is plain 16:9; the app does not scroll behind
  the player.
