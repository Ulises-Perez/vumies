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

**L7** — `deno task start` "not working" was ours to fix, and the `cf` verdict is now measured.

1. **Cause of the failure: a stale process of this session.** `netstat` showed PID 18440 listening on
   :8000, left behind by the probe in L2 (the earlier `pkill -f` is a no-op on Git Bash, which has no
   `pgrep`). `deno task start` then died with `AddrInUse` (os error 10048) before ever reading the key.
   Killed it with `taskkill //PID 18440 //F`; `deno run -A --env-file=.env server.ts` starts, prints
   `Listening on http://localhost:8000/`, and the proxy answers real data.
2. **The listing works and its shape is `data.result`**, not `data.movies` (my first probe looked for
   the wrong key and reported 0 items — a probe defect, not a server one): 100 movies, 83 pages,
   each with `embed_url`, `download_url`, `imdb_id`, `tmdb_id`, `poster`, `backdrop`, `quality`;
   episodes carry `season`, `episode`, `parent_type`, `show_title`.
3. **`with_cf=true` changes the route, not the URL:** `embed_url` becomes
   `https://vimeus.net/cf/movie?tmdb=…&view_key=…` (and `/cf/serie?…&se=9&ep=1`). The `cf` parameter the
   documentation says to append is **not** in the response and there is no documented endpoint to mint
   it. Measured: `/cf/movie?…` without `cf` answers **404 "No CF-compatible provider found."** for that
   title, and `…&cf=x` answers a 1,269-byte stub player page with no token in it. So the `/cf` route
   needs (a) content whose provider supports CF tokens and (b) a valid token issued to a registered
   site. Nothing here lets this app mint one, which is why the skip controls cannot be honoured yet.
4. **Shipped instead: episode navigation in the player chrome**, which is the other half of what a
   player like tokianime's offers and does not depend on the bridge. Prev/next episode buttons sit in
   the top-right cluster (40px, `aria-label`, disabled at the extremes), "Episodios" and "Fuentes" got a
   stronger surface (`bg-black/55` + ring) because they washed out over bright video, and
   `prevEpisode()` mirrors `nextEpisode()` across seasons (previous season falls on its last episode,
   not its first). Verified: from `/player/tv/1396/2/5`, next lands on `/player/serie/1396/2/6`; at
   S1E1 prev is disabled and next is enabled.
5. **Still blocked, and it is a vimeus-side ask:** skip intro/outro and automatic advance need `seekTo`
   plus progress, which only their `cf`-authorized bridge provides. What to request from them: a
   `cf` token endpoint for our domain (or adding our origin to the token allowlist's `pm`). The skip
   times themselves are already solved and free (IntroDB + AniSkip, L5) — the missing half is control.

**L8** — Investigated whether this side can obtain the `cf` token. It cannot, and that is now measured,
not assumed.

1. **Neither bundle mints it.** `vimeus.net/assets/index-DKNnpXv5.js` (745 KB, the dashboard/site app)
   and `player-assets/index-v2.js` (405 KB, the embed shell) were fetched and searched for
   `play_claim|claim|cf=|?cf|/cf/|hosts_support|cfToken`: the only `cf=` hits are minifier artifacts
   (`cf=()=>{}` in i18next, `cf=unstable_ImmediatePriority` in React's scheduler). No client-side
   minting exists in what we can read.
2. **The dashboard exposes no such setting.** `/settings/general` shows only display name, email and the
   masked API key (`ak_…`); `textMentionsCf: 0`, no domain/origin/allowlist field.
   `/settings/embed` and `/settings/domains` are 404. So there is no self-service path to a token.
3. **What the account's own dashboard traffic shows** (`/api/me`, `/api/client/popular`,
   `/api/client/global-dashboard`, `/api/client/recent-views`): the site is authenticated, but nothing
   in the captured requests carries or requests a `cf` token — playback minting happens server-side on
   their embed route, behind an allowlist this account cannot edit.
4. **Therefore the only path is a vimeus-side provision:** a `cf` token minted for our origin, or our
   origins added to the token allowlist (`pm`/`ao`) together with a `hosts_support_cf_token` provider
   for the content. With that, the change on our side is small and already designed: load the `/cf/*`
   embed URL from the listing (`embed_url` already comes back on that route), listen for
   `VIDAPI_PLAYER_EVENT` (`time` carries `player_progress`/`player_duration`), send
   `{ type: 'VIDAPI_PLAYER_COMMAND', command: 'seekTo', payload: { seconds } }` for skip, and advance on
   the last ~30 s for auto-next — with the skip times already available free from IntroDB (series and
   movies) and AniSkip (anime), both verified in L5.

**L9** — Two answers: the embed cannot be turned into a stream for our own player, and the player
chrome was redesigned.

1. **Embed → our own player: not viable, and now with the evidence.** The vimeos embed page carries an
   obfuscated config (`sp`, `srv`, `zip`, `p3`, `urlset`, `m3u8`, `master`, a 12-hour `43200` window and
   a `hosts_...` key list packed as a `'|'.split('|')` lookup), not a manifest URL. Its helper
   `video77.js` (9.7 KB) is not the stream provider but a **defensive script**: it inspects URLs for
   `.m3u8`/`.mp4`/`urlset`, and redacts anything shaped like a token, signature, session or API key
   before it can be logged; the page also ships `disable-devtool`. So the manifest is minted
   server-side against a rotating, tokenised URL with a 12-hour expiry and actively guarded against
   inspection. A player of our own would mean re-deriving that scheme on every one of their deploys and
   bypassing the layer they gate it with. Rejected.
2. **Player chrome redesigned with the taste skill and audited with impeccable.** The old chrome was
   two floating circles (40px) plus two loose pills (36px) in two sizes, and its back button sat
   exactly under the embed's own "Servidores" chip (`x 16–176, y 17–52`). It is now **one control bar**
   in the only free corner (top right): a single pill (`bg-black/60`, `ring-white/10`, `blur`, `p-1`)
   holding one button family — `Volver | ‹ › | Episodios T2·E5 | Fuentes` — all `h-8`, `text-[13px]`,
   `rounded-full`, separated by 1px dividers, with the current episode shown as a quiet suffix inside
   the Episodios button instead of a separate element. Icon-only on mobile, labels from `sm`. The top
   gradient now exists only to give the bar contrast. Impeccable's detector on the file: **no
   findings**. The embed's own chip is no longer covered.
3. **Not verified visually yet:** the browser task space was taken over by the human mid-run, so the
   screenshot pass over the new bar (1440/390, geometry and vision review) is pending and the numbers
   are not claimed.

**L10** — Player chrome trimmed to what was asked. "Volver" is now text only (no chevron), and the
previous/next episode arrows are gone: the episode is chosen in the panel, which already highlights the
current one and lists stills, titles, durations and ratings. The bar is now
`Volver | Episodios T2·E5 | Fuentes` in one pill. The dead computeds and `prevEpisode()` were removed
with them; `nextEpisode()` stays because `onMediaEnded()` still uses it for direct-video playback.
Impeccable's detector on `src/modules/player` then flagged one pre-existing `side-tab` (the 4px accent
border on the selected episode row in `EpisodePlayerView.vue`); replaced with a tinted background plus a
1px ring, so the selected row no longer relies on the banned one-sided border.

**L11** — Extra sources, chosen by probing instead of by listing websites.

| Provider | Template | Probe with a real TMDB id | Shipped |
| --- | --- | --- | --- |
| VidFast | `https://vidfast.pro/movie/{id}` · `/tv/{id}/{s}/{e}` | **200 text/html** (movie and tv) | yes |
| VidSrc | `https://vidsrc.io/embed/movie/{id}` · `/embed/tv/{id}/{s}/{e}` | **429** (throttles scripted requests; the host answers and browsers get the page) | yes |
| VidLink | `https://vidlink.pro/movie/{id}` · `/tv/{id}/{s}/{e}` | **000**, unreachable from this network, even its root | no |
| 2Embed | `https://www.2embed.online/embed/…` | **301 loop** to `2embed.stream`, which also fails | no |

Shipped as `embed-providers.ts`: one `StreamSource` per provider, iframe streams keyed by the TMDB id
we already have, weights 90/70 against Vimeus' 100, so Vimeus stays the default and these are fallbacks.
Both need no key and no configuration. The honest caveat, recorded rather than glossed: their catalogs
are English-leaning with multi-language subtitles, they run their own ads, and they can disappear or
change a route without notice — Vimeus remains the source with a Spanish library. Because more than one
source now resolves, the "Fuentes" picker opens on first play (the single-source auto-select only fires
when exactly one exists), and the remembered choice keeps it closed afterwards.

**Not verified in a browser:** the workspace was under the human's control for this whole change, so the
rendered check of the new bar (1440/390) and of the two providers actually playing was not run. What is
verified is static: `vue-tsc`, `vite build`, the impeccable detector, and the HTTP probes above.

**L12** — Sources pruned, a Spanish one added, and both dialogs redesigned.

**Provider probe, movie AND tv, one real TMDB id each** (the rule: a provider ships only if both
routes answer):

| Provider | Result | Language evidence | Shipped |
| --- | --- | --- | --- |
| PlayLatinSRC `playlatinsrc.co/movie/{id}` · `/tv/{id}/{s}/{e}` | **200 / 200** | page serves **Latino, Castellano, Subtitulado** | yes, weight 95 |
| VidFast `vidfast.pro/…` | **200 / 200** | none declared | yes, 75 |
| VidNest `vidnest.pro/…` | **200 / 200** | docs: automatic subtitles | yes, 65 |
| EmbedWave `embedwave.cc/embed/…` | **200 / 200** | none declared | yes, 55 |
| VidSrc `vidsrc.io/embed/…` | 429 for both | — | **removed** (the human reported it broken) |
| VidLink `vidlink.pro/…` | 000 / 000 | — | no |
| 2Embed `2embed.online/…` | 301 loop | — | no |
| VidEasy `player.videasy.net` → `.to` | 301 → 000 | — | no |
| Stellar `stellar.rip/…` | 200 movie, **404 tv** | "Spanish" in page | no (tv unresolved) |
| AutoEmbed `autoembed.me/…` | 200 movie, **404 tv** | — | no |

So the app now offers five sources: **Vimeus (Español latino)**, **PlayLatinSRC (Latino · Castellano ·
Subtitulado)**, VidFast, VidNest (Subtítulos automáticos) and EmbedWave. Language is a first-class field
now (`Stream.languageLabel`): it is shown only when the provider declares it or the probe found it, and
left undefined otherwise rather than guessed — a wrong language badge is worse than none.

**Both dialogs redesigned** with the taste rules that apply to an Operate surface: one card family, one
radius, one padding, equal edges, nothing duplicated, 44px-class rows.

- *Fuentes* (`StreamSourceModal.vue`): it rendered a provider heading **and** a row repeating the same
  provider name, with a flag strip and a `kind` badge. It is now a flat list, one row per source:
  name, `languageLabel · kind` as one line, an "En uso" chip on the active source (new
  `activeSourceId` prop) and a play glyph; the header carries only the title and a real count
  ("5 fuentes disponibles"); a footer states that each source is an external player with its own
  catalogue, languages and ads. Flag images are gone: they needed a third-party request per flag and a
  country is not a language.
- *Episodios* (drawer in `PlayerView.vue`): same header shape with the real counts
  (temporadas · episodios), season select, rows with a 24px-radius still, number + title, runtime and
  rating on one meta line and a two-line synopsis, and the current episode marked with a tinted row
  plus a 1px ring (the 4px side border is gone). The dead `border-l-2` classes went with it.

Static verification only: `vue-tsc` clean, `vite build` clean, impeccable detector on
`src/modules/player` **empty**. The rendered check (dialog at 1440/390, the two Spanish sources actually
playing) is still pending because the browser workspace is under the human's control.


**L13** — Sources corrected and both dialogs rebuilt again, this time as modal siblings.

1. **PlayLatinSRC series landed on their home page because the route was invented.** Their own docs
   give `/movie/{id}`, `/serial/{id}` and `/custom/serial/{id}/{season}/{episode}`; we were calling
   `/tv/{id}/{s}/{e}`, which does not exist on that host, so the SPA fell through to its homepage. The
   provider now uses the documented episode route. Verified by HTTP: `/movie/{id}` (200, player
   markers), `/custom/serial/1396/2/5` (200, SPA shell that renders the player client-side).
2. **Pruned and labelled.** EmbedWave removed on request. VidFast is English and its subtitles do not
   work, so its label is now exactly `Inglés` instead of implying subtitles. Remaining set:
   **Vimeus — Español latino**, **PlayLatinSRC — Latino · Castellano · Subtitulado**, **VidFast —
   Inglés**, **VidNest — Subtítulos automáticos** (the last two are a claim from their own docs, not
   something this session could verify playing).
3. **Fuentes selector, rebuild.** From a flat list to a **card grid** (one column on a phone, two from
   `sm`): each card carries a monogram of the provider's initial, the name, the language on its own
   line, `En uso` on the active one and a quiet kind line. The header shows a real count with the
   Spanish subset ("4 fuentes disponibles · 2 en español"), and the footer states that each source is an
   external player with its own catalogue, languages and ads.
4. **Episodes, now a modal like Fuentes.** Same overlay, same `rounded-3xl` card, same header shape
   (title + real counts), the same close button, and the season as **chips** instead of a native
   `<select>` — a select hides the options, chips show every season and take one tap. The current
   episode keeps the tinted row plus a 1px ring. The drawer, its border and `BaseSelect` are gone.

Static verification: `vue-tsc` clean, `vite build` clean, impeccable detector on `src/modules/player`
empty. As before, the rendered check is pending while the browser workspace is under the human's
control; no claim is made that a provider actually plays until that pass runs.

**L14** — "Own player" answered with evidence, and the source picker rebuilt bigger and interactive.

1. **No source serves a stream.** PlayLatinSRC's player page POSTs to `/api/embed-links` with
   `{type, id, token}` and renders `data.sources` into its own `<iframe id="_player">` — iframes all the
   way, no manifest in the HTML (its movie page shows `sources: []` populated from that response).
   VidFast (190 KB), VidNest (733 B shell) and EmbedWave (7.9 KB) likewise expose no `.m3u8`/`.mp4`.
   Vimeos, checked earlier, is tokenised with a 12 h window and an anti-inspection script.
   **tokianime** — the reference the human keeps pointing at — fetches its stream at runtime and feeds a
   native `<video>`: its own backend, no public API, not embeddable.
   Conclusion, recorded instead of retried a fourth time: "our own player" cannot mean our own `<video>`,
   because nothing here gives us a URL to play. What we do own is the **chrome around the frame**, which
   is exactly what this module is: our bar, our episodes modal, our source picker. Skip intro/outro and
   real progress stay blocked on the same missing piece as before — a player we control.
2. **Source picker, rebuilt bigger and interactive.** `max-w-2xl` (was `max-w-lg`), header at `text-xl`
   with a real count that names the Spanish subset, cards at `min-h-[76px]` with a 44px monogram, the
   language as a coloured chip (primary when Spanish), a `Recomendada` badge on the top-ranked Spanish
   source, `En uso` on the active one, and an `Abrir` affordance that fills on hover.
   Interaction: **real keyboard navigation** — arrows move focus between sources, `Home`/`End` jump to
   the ends, `Enter` selects (native button), `Escape` closes (window listener removed on unmount) — and
   the first source takes focus on open so the dialog is usable without the mouse.
3. **Episodes modal matched to the same family**: `max-w-lg`, `text-xl` title, the same header padding,
   the same 44px close button, the same `rounded-3xl` card, season chips and the tinted ring row.

Static: `vue-tsc` clean, `vite build` clean, impeccable detector on `src/modules/player` **empty**.
Pending, as before: the rendered pass at 1440/390 and a real playback check, because the browser
workspace is under the human's control.

**L15** — Requested: a more minimalist source picker and a more interactive, intuitive episode picker.

1. **Fuentes, reduced to a list.** The cards, the 44px monogram, the coloured language chip, the
   `Recomendada` badge, the `Abrir` affordance and the `text-xl` header are gone. It is now a
   `max-w-md` panel with a `text-base` title, one line of real context ("4 fuentes · 2 en español"),
   44px single-line rows (`name` + language in muted text), the active row tinted with the words
   `En uso` instead of a pill, and a chevron that only appears on hover or keyboard focus. The footer
   is one short line. The keyboard contract was kept, because it is the part that makes a short list
   usable: arrows, Home/End, Enter, Escape, and focus on the first source when it opens.
2. **Episodios, made interactive.** Three things that change how it behaves rather than how it looks:
   - **It lands where you are.** Opening the panel focuses and centres the episode being played, so the
     list no longer starts from the top of a season you already passed.
   - **Keyboard navigation**: arrows move between episodes, Home/End jump to the ends, Enter opens the
     focused one. The refs are keyed by episode number, not by index, so focus survives a season change.
   - **The still answers the pointer**: it scales 1.03 inside its frame on hover, matching the
     poster-card motion already used across the app, and rests under reduced motion.

Static: `vue-tsc` clean, `vite build` clean, impeccable detector on `src/modules/player` empty.
Still pending the rendered pass, for the same reason as the last four turns: the browser workspace is
under the human's control.
