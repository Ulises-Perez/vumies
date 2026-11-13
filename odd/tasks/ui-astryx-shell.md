# Astryx-aligned shell, minimalist top bar, unified structure

Redesign the Vumies app shell and the catalog screens on Astryx's scales and conventions, ported natively to Vue 3 + Tailwind (Astryx core is React 19 only). The floating top bar stops being one full-width surface, and the 5 container recipes, 5 hero heights, 4 grid recipes and 2 vertical rhythms collapse into one defined system.

Mode: Operate (app UI). The violet brand identity, the copy and every existing feature stay.

## Specs

S1. The top bar becomes more minimal. Exact words: "Quiero mejorar el navbar, para que sea mas minimalista". Fewer controls, one visual weight, no element that is not navigation, identity or search.

S2. The top bar stops being one full-width surface. Exact words: "no me gusta que sea completo", decided as "Que ocupa todo el ancho". The menu toggle, the wordmark and the search trigger each carry their own surface; the span between them is transparent, so the content behind reads through the middle of the bar. It stays a single fixed layer with one height and one alignment line.

S3. The background treatment the user likes stays. Exact words: "me gusta mucho el tema del background". Translucent token surface plus blur, the violet brand accent and the theme switcher (claro/oscuro/sistema) are kept; only the full-width plate goes.

S4. Astryx is implemented as ported tokens and conventions, not as a dependency. Exact words: "un plan sobre implementar https://astryx.atmeta.com/docs/getting-started en la pagina, sobre todo en el aspecto de la vista de las peliculas y series", decided as "Portar tokens y convenciones a Vue". `@astryxdesign/core` is React 19 + StyleX and never becomes a Vumies dependency. Ported, with Astryx's published values: the spacing steps (`0, 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10` → 0/2/4/6/8/12/16/20/24/32/40px), the radius token names (`inner 6px`, `element 10px`, `container 12px`, `page 28px`, `full`), the type scale (base 14px, ratio 1.2 → 10/12/14/17/20/24/29/35/42px) with heading/body/label/supporting triplets, and the control heights (`--size-element-sm 28px`, `md 32px`, `lg 36px`). The existing shadcn/ui token names keep working.

S5. The whole structure is aligned and defined once. Exact words: "Mejorar la estructura completa para que todo este correctamente alineado y definido correctamente", decided as "Todo: contenedor, hero, grilla, ritmo". Exactly one container recipe (gutter + max width), one hero height scale chosen by view kind, one responsive grid recipe, one vertical rhythm scale. Search, Favorites and History stop double-guttering. Equal left and right content edges on every screen.

S6. The movies and series screens get the Astryx treatment above all. Exact words: "sobre todo en el aspecto de la vista de las peliculas y series". The catalog views use the ported grid (reflowing columns, no fixed breakpoint ladder), the ported card surface, and one rail primitive shared by every horizontal row.

S7. Nothing that works today stops working. Exact words: "Mejorar". Every route, filter, favourite, history entry, settings toggle, sidebar behaviour, command palette and player embed keeps working; `vue-tsc` and `vite build` stay clean; reduced-motion still disables motion.

S8. Everything is audited with impeccable after the change. Exact words: "Todo esto se va a auditar con impeccable para que quede todo clean". Every changed screen is detected and its findings resolved before the work is reported done.

S9. The mosaic becomes the opening of the home route. Exact words: "Continuamos verificando, mejorando y aplicando correctamente el diseño de mosaico http://127.0.0.1:57430/q--yusWkxFgaHOWzpZYkdrSM2zz6zq7D/d/shell-astryx/ correctamente en el inicio." The `/` route stops opening with the 480px backdrop hero and opens with the same mosaic the movies and series screens already use; the lead tile carries the `h1`, the year, the score, the overview and the primary action that the hero used to carry, so no editorial capability is lost. The mosaic is one shared component, not a third inline copy. Real rails keep their real content; no rail, chip or progress value is invented to match the artboard.

## Tasks

- **T1** — Design system sync: `design/system.md` (current tokens with their source paths) and `design/system.html` (token board). `Spec: S5` · route: inline
- **T2** — Three artboard directions for the shell plus the movies view, opened on the canvas for the human to choose. `Spec: S1, S2, S4, S6` · route: inline + writers
- **T3** — Port the Astryx scales into `src/style.css` and `tailwind.config.js`, additively: spacing steps, radius names, type scale, control sizes. `Spec: S4` · route: inline
- **T4** — Layout primitives in Vue: `BaseStack` (`direction`, `gap`, `padding`, `align`, `justify`, `wrap`) and `BaseContainer` (the one recipe). `Spec: S4, S5` · route: inline
- **T5** — Collapse containers, hero heights, grids and vertical rhythm into that system and migrate the 10 views. `Spec: S5` · route: inline + writers
- **T6** — Rebuild the top bar as floating pieces with a transparent middle, keeping the blurred token surface per piece. `Spec: S1, S2, S3` · route: inline
- **T7** — Restructure the movies and series views on the chosen artboard: ported grid, card surface and one shared rail. `Spec: S6` · route: inline
- **T8** — Verify: `vue-tsc`, `vite build`, real-browser checks at 1440/1024/768/390 (edges, overflow, tap targets, contrast), impeccable audit. `Spec: S7, S8` · route: verifier when a high-risk item is named
- **T10** — Extract the inline mosaic from `MoviesView` and `SeriesView` into one `MosaicHighlights` component with a normalized view model, and migrate both views to it. `Spec: S5, S6, S9` · route: writer · commit `b3072a0`
- **T11** — Rebuild the home route on that mosaic: hero removed, mosaic first, real rails kept with the mosaic's own items de-duplicated. `Spec: S9` · route: writer · commits `b3072a0`, `b02bdb1`
- **T9** — Update `README.md` and close this document with the commits that hold each task, after T10 and T11. `Spec: S7` · route: inline · commit `b02bdb1`

## Log

**L1** — Original request, verbatim:

> Quiero mejorar el navbar, para que sea mas minimalista, me gusta mucho el tema del background, pero no me gusta que sea completo, quiero mejorar tambien o agregar y un plan sobre implementar https://astryx.atmeta.com/docs/getting-started en la pagina, sobre todo en el aspecto de la vista de las peliculas y series.
>
> Mejorar la estructura completa para que todo este correctamente alineado y definido correctamente.

**L2** — Three decisions taken by the human through the interview: Astryx → "Portar tokens y convenciones a Vue"; navbar background → "Que ocupa todo el ancho"; structural scope → "Todo: contenedor, hero, grilla, ritmo".

**L3** — Astryx research (published docs and shipped CSS, v0.7.13): `@astryxdesign/core` requires React 19 and StyleX, so it cannot be installed in a Vue 3 app; what is portable is its token contract, which is plain CSS custom properties. Spacing `--spacing-0..12` = 0/0.125/0.25/0.375/0.5/0.75/1/1.25/1.5/1.75/2/2.25/2.5/2.75/3 rem. Radius (`theme-neutral` build) `inner 0.375rem / element 0.625rem / container 0.75rem / page 1.75rem / full`. Type scale base 14px ratio 1.2. Control heights `--size-element-sm 28px / md 32px / lg 36px`. Layout primitives `Stack/VStack/HStack` (`gap`, `padding*`, `hAlign`, `vAlign`, `wrap`), `Grid` (`columns` accepts `{minWidth, max}` so it reflows without breakpoints), `AppShell` (`topNav`, `sideNav`, `contentPadding`, `mobileNav`, `variant`), `Carousel` (`gap 0-4`, `hasButtons`, `hasEdgeFade`, `hasSnap`). Components relevant to a catalog that exist: `TopNav`, `SideNav`, `Card`, `ClickableCard`, `Thumbnail`, `Grid`, `Carousel`, `Badge`, `TabList`, `SegmentedControl`, `Skeleton`, `EmptyState`, `Breadcrumbs`, `AspectRatio`. No rating or score component exists. Docs and shipped code disagree on radius values, heading weights and default font family; the values above are the shipped ones and are the ones this feature ports.

**L4** — Baseline measured on the current tree: 5 container recipes (`.container-custom`, full-bleed `pl-4 md:pl-12`, `px-4 md:px-12`, `px-4 md:px-12` plus a nested `.container-custom`, `max-w-3xl`), 5 hero heights (`85/80/70/60vh`), 4 grid recipes, vertical rhythm `space-y-12` everywhere but detail blocks mixing `space-y-8/10`. Top bar: `fixed z-[65]`, one `div` at `max-w-[110rem]` with `bg-popover/70 backdrop-blur-xl border-border/60` and a conditional drop shadow. SideMenu hardcodes the bar height (`top-16` / `sm:top-[4.625rem]`).

**L5** — `src/modules/ui/components/AppTopBar.vue` and `src/modules/ui/components/SideMenu.vue` already carried uncommitted human edits when this feature started. Those edits were not authored by this feature and are not to be folded into its work units without the human's word.

**L6** — Design system synced from the project's own sources: `design/system.md` (tokens with their source paths, plus the gap inventory) and `design/system.html` (token board, 1440px). No value was invented; the five container recipes, five hero heights, four grid recipes and two vertical rhythms recorded there are the inconsistencies this feature closes.

**L7** — Three artboard directions written to `design/shell-astryx/`, manifest in `design/shell-astryx/design.json`: `01-piezas-sueltas.html` (each top-bar piece carries its own surface, transparent middle, catalog keeps the rails), `02-una-linea.html` (a hairline blur band masked to nothing at both ends, catalog drops the rails for one reflowing grid) and `03-mosaico.html` (zero visible chrome, mosaic with explicit spans and a single "Continuar viendo" rail). They differ in bar treatment and catalog structure, not in colour; each is labelled with the tradeoff it makes. The chosen one is recorded here once the human picks it and the other two stay as alternatives.

**L8** — The human chose **`design/shell-astryx/03-mosaico.html`** ("Mosaico"): zero visible chrome in the top bar, and a catalog built as a mosaic with explicit spans plus exactly one rail. `01-piezas-sueltas.html` and `02-una-linea.html` remain as alternatives and are not implemented.

**L9** — Deviation from the chosen artboard, decided by the orchestrator: the artboard puts a theme-cycle button in the bar, but the sidebar already carries the theme control, and the sidebar's own header was removed in the human's uncommitted work. Adding a second entry to the same setting would be a clarity regression, so the bar keeps menu + wordmark + search only. Recorded here rather than silently dropped.

**L10** — The human's uncommitted `SideMenu.vue` work is a real redesign: the panel now runs from just under the top bar to the bottom of the viewport and no longer duplicates the wordmark or the search field. It is preserved. Its hardcoded offsets (`top-16`, `sm:top-[4.625rem]`) were replaced by the new `--chrome-top` token so the two surfaces cannot drift apart again.

**L11** — Independent browser measurement of the three artboards found two real defects, both fixed before implementation:

1. **`03-mosaico.html`, mobile only.** At 390px the mosaic tiles overlapped: the lead tile (64..384) intersected Severance and Shōgun (246..486) by 173x138 each, 23,874 px² per pair, and two more pairs by 173x58. Root cause: `grid-auto-rows: 170px` together with `min-height: 320px` on the lead and `240px` on the tall tiles, so items overflowed their rows and later siblings painted over earlier ones. The h1 band contained no white glyph pixel and the primary action was fully covered. Fixed by moving the mobile mosaic to `grid-auto-rows: auto` with per-tile `aspect-ratio` and `min-height: 0`. Re-measured by this session with `elementFromPoint` and rect intersection: **0 overlapping tile pairs at 390, 768 and 1440**, horizontal overflow 0, and the h1 is the topmost element at its own centre. The CTA probe matched the lead tile link instead of the "Ver ahora" button, so the button itself was not independently proven; it is recorded as unverified rather than assumed good.

2. **`01-piezas-sueltas.html` and `02-una-linea.html`.** `.wrap` was a flex child carrying `margin: 0 auto`, so it shrank to its content instead of stretching: the hero text sat 468px (01) and 392px (02) off the grid line at 1440. Fixed with `width: 100%`. Those two boards are alternatives and are not implemented.

3. Tap-target note: 12 nodes in `03` measured under 44x44 (32px bar icons, 36px rail arrow, 28px chips). WCAG 2.2 AA requires 24x24, so 32px is not a violation; the 44px figure was this session's own stricter threshold. Mobile controls were raised to 40px and chips to 32px in the artboard anyway, since touch comfort is the real complaint at 390.

The production `.container-app` already declares `width: 100%`, so it is immune to defect 2.

**L12** — The five-surface worker delivered with a per-file grep table (all leftovers 0, `pnpm type-check` clean). A full-repository sweep by this session then found the recipe still alive outside every writer's allowed surfaces, and closed it here: `SkeletonDetail.vue` (2 × `px-4 md:px-12` → `container-app`, `h-[85vh]` → `h-[var(--hero-lg)]`), `SkeletonHero.vue` (`px-4 md:px-12` → `container-app`, default `h-[70vh]` → `h-[var(--hero-md)]`) and `SkeletonGrid.vue` (the 6-column breakpoint ladder → `grid-posters`, so the skeleton reflows exactly like the real grid and cannot drift). `.container-custom` had zero remaining consumers and was removed from `src/style.css`, leaving one container recipe in the codebase. `MovieDetailView`'s bento keeps its deliberate `auto-rows` composition with only its gap moved onto `--grid-gap`.

**L14** — The human asked to continue and to apply the mosaic correctly on the home route, and to launch the subagents needed to see it: "Continuamos verificando, mejorando y aplicando correctamente el diseño de mosaico http://127.0.0.1:57430/q--yusWkxFgaHOWzpZYkdrSM2zz6zq7D/d/shell-astryx/ correctamente en el inicio. Lanza los subagentes necesarios para que puedas ver, todo correctamente." Recorded as S9 and split into T10 (one shared mosaic component, replacing the two inline copies that already drifted) and T11 (home rebuilt on it).

**L15** — Three decisions taken by the orchestrator for S9, recorded instead of shipped silently:

1. **The rails stay.** `03-mosaico.html` shows exactly one rail, but home carries four real sections fed by real endpoints (trending, now playing, upcoming, popular series). Deleting them to match the artboard would break S7, so the mosaic changes the opening, not the catalogue underneath. The artboard's single rail is honoured where it has real data, not by removing real data.
2. **No invented progress.** The artboard's rail card carries a 3px progress bar and a remaining-minutes line. `WatchHistoryItem.progress` exists but `addToHistory` never writes it, so any such value would be fabricated; the rail either renders real history without a progress bar, or is not added.
3. **The mosaic is extracted, not copied a third time.** It lives inline in `MoviesView.vue` and `SeriesView.vue` and the two copies already drifted (badge variant `default` vs `secondary`, score `text-primary` vs `text-green-400`, row-span fixed only in Movies). T10 builds one component with a normalized tile model and migrates both, so home cannot inherit the drift.

**L13** — Implementation verified by this session, not by writer reports. `pnpm type-check` and `pnpm build` both exit 0 in one authoritative run. Real-browser measurements on the dev server:

- **Mosaic, the artboard's failure mode, does not reproduce.** `/movies` and `/series` render 4 mosaic tiles, **0 overlapping pairs** at 390 (2 columns) and at 768/1440 (6 columns), horizontal overflow 0, with 54 and 37 cards respectively.
- **Zero-chrome bar**: every control measures 32px tall on all nine routes; no plate, border or shadow at rest.
- **Gutter token applied everywhere**: `.container-app` computes `padding-left: 48px` at 1440 on every route measured.
- **A real regression was found and fixed.** The content wrapper still carried `-mt-20 relative z-10` from the era of 630px heroes, where it overlapped empty hero space. With `--hero-md` (384px) the hero's action row ends exactly at the hero's bottom edge, so on `/movies` the primary CTA sat underneath the content wrapper and received no clicks (hit-test returned the content div at all three widths). Removed `-mt-20` in `MoviesView` and `SeriesView`; the hero CTA and the mosaic CTA now hit-test clean at 1440 and 390. `/` was never affected because its 480px hero keeps its actions clear.
- **Two probe defects of mine were corrected before trusting any number**: the mosaic has no literal `mosaic` class (it is `<section aria-label="Destacados">`, so an earlier run measured zero tiles and proved nothing), and `scrollIntoView` triggered the app's smooth scroll, so rects were read mid-animation and produced a false "CTA covered" reading. Both were fixed and everything above re-measured.
- **Not proven**: `/series`' hero has no action matching the probe's label, so its hero actions are not independently verified (the overlay that caused the defect was removed there too); tile depths under a slow network were not exercised; skeleton states were migrated but not screenshotted.

**L14** — The mandated `impeccable` audit (S8) ran over 8 routes at 1440 and 390 and found defects this feature had introduced, all fixed and re-measured here:

- **Hero clipping (blocker).** A fixed `h-[var(--hero-md)]` with `overflow: hidden` cut the content it was supposed to hold: on `/movies` the eyebrow sat at y −25.5 and the CTA row at 368.5–412.5 inside a 384px hero, so the primary button received no clicks. The hero content was inside an `absolute inset-0` overlay, so nothing contributed to the section's height and `min-height` alone could not fix it. Heroes now use `min-h-[var(--hero-*)]` with a flowing content column. Re-measured: hero grows to 544 (`/movies`) and 472 (`/series`), last action bottom 464 and 392, both strictly inside; same on `/`, `/search` and `/favorites` at 1440 and 390.
- **Mosaic dead area (important).** Row 3 was filled only 428.7 of 1334px because the tall tiles carried `aspect-[2/3]` inside a two-row span and the wide tile spanned 2 of 6 columns. Talls now fill their span on `md+` and the wide tile spans the full row: coverage 0.94–0.95 with 0 overlapping pairs (the remainder is `--grid-gap`, not dead space).
- **Zero-chrome bar contrast (blocker).** With no resting surface the glyphs sat on photography with 1.04:1 (`/movies` menu) and 1.5:1 (`/search` keycap). Each control now has its own translucent surface with blur; measured `oklch(0.165 0.005 285 / 0.6)` + `blur(12px)` on the three 32px controls and `oklch(0.165 0.005 285 / 0.7)` + `blur(12px)` on the keycap. The middle of the bar stays transparent, so the direction survives.
- **Two `h1` per page** on `/movies` and `/series` (hero + mosaic lead) reduced to one; the mosaic lead title is now `h2`.
- **`text-shadow-lg` was dead** (Tailwind 3 has no such utility, `getComputedStyle` returned `none` on 8 hero titles): added as a real utility.
- **`design/system.md` drift**: it still described `.container-custom` and claimed no container max-width. Rewritten to the actual contract.

The audit also reported defects that pre-date this feature; the human chose to fix them in the same feature, and they are in the same commit: 8 eyebrow badges above headings removed (the skill bans them outright), `h1` added to the Favorites, History and empty-Search states, `SettingsView` section headings raised from `text-sm` to `text-lg` so a section heading no longer measures smaller than its own paragraph, `text-green-400` (1.74:1 in the light theme, and a second accent hue in a system that declares violet at hue 285) replaced by the `text-primary` token, and the hero scrims moved to `.scrim-b`/`.scrim-r`, which stay dark in both themes instead of inheriting `--background` (in light theme the hero art disappeared: 40.3% of its pixels above L 0.7).

**L15** — Commit `b79597b` on `feature/ui-shell-ambilight` holds the whole feature as one slice: 38 files, 3272 insertions, 613 deletions, including the human's own `SideMenu` redesign and the ambilight removal that preceded it. The human chose a single commit over chained slices and accepted the review cost with that tradeoff stated. The branch is therefore one delivery unit past the ~400-line slice guidance; any further work belongs to a new slice, not to this one. Delivery (push, PR, merge) remains the human's decision.

**L16** — `type-check` and `build` pass in a single authoritative run after every fix. Not verified: `/series`' hero carries no action matching the probe's label, so its hero actions are not independently hit-tested (the overlay that caused the defect was removed there too); skeleton states were migrated but never screenshotted; slow-network behaviour and LCP were not measured; the audit's own light-theme sampling was done by toggling the class in the page, not by changing the persisted preference.

**L17** — S9 implemented as two slices, because the first one alone was already at the review-size
guidance and the second changes two page structures.

`b3072a0` — the extraction. `MosaicHighlights.vue` owns the recipe; `/` opens with it and its lead
carries the `h1`, the year, the score, the synopsis and the primary action the 480px hero carried.
Six defects found while verifying that slice, all fixed inside it:

1. **Home dropped `upcoming[3..]`.** The wide band took the first three entries of a collection whose
   rail had been deleted, so the tail was unreachable. The "Próximamente" rail is back with the tail.
2. **Rails repeated what was above them.** `/movies`' hero was also the first "Películas Populares"
   card, and `/series`' wide band listed three shows the popular rail rendered again. Each rail now
   starts where the mosaic ends.
3. **Badge drift.** Only home passed a badge. Tiles carry the label of the endpoint that feeds them
   and the lead carries none: its kicker already says the same thing, and two labels for one fact on
   one tile is noise.
4. **`hasMosaic` defeated the component's own skeleton**, so "loading" and "empty" were the same
   state and a failed fetch could leave an eternal skeleton with no `h1`. The component now takes
   `loading`: skeleton while unknown, nothing when the load settles empty.
5. Dead `.scrollbar-hide` blocks in two views, and a literal `24rem` replaced by
   `--mosaic-lead-min` in the layout contract `design/system.md` documents.
6. `AnimeView` (behind `FEATURES.anime=false`, so unreachable in this build) still had the
   fixed-height hero with an absolutely positioned overlay plus `-mt-20`. Verified by temporarily
   flipping the flag: hero 384px, `h1` inside, no overflow. The flag was reverted before committing.

`b02bdb1` — the catalog views. `03-mosaico.html` has no hero, so `/movies` and `/series` opened with
a 384px hero *and* then the mosaic: two editorial openings per page, the first carrying the oldest
recipe. Both now start with the mosaic and its lead is the `h1`. Nothing the hero did was dropped:
the movies hero's "Mi Lista" moved to the lead tile through a new `lead-actions` slot and was
verified by clicking it (filled state flips, `localStorage` 25 → 237 bytes); its score, year,
synopsis and primary action were already what the mosaic lead renders. The popular rail returns to
the full collection on `/movies` now that its first item is no longer the hero, and `/series` feeds
the wide band from `popular[0..2]` and the rail from `popular[3..]`, so nothing repeats and nothing
drops.

**L18** — The mandated `impeccable` audit (S8) ran on the changed screens (detector: no findings) and
found one blocker this feature had introduced, plus two smaller a11y gaps, all fixed and
re-measured:

- **Text over art followed the theme over a scrim that does not (blocker).** `MosaicHighlights`
  used `text-foreground`, `text-muted-foreground` and `text-primary`. The scrims are
  `oklch(0.1 0.02 285)` in both themes, so in the light theme the lead and tall titles measured
  **1.15:1** and the score **3.88:1** — unreadable text on the primary opening of three routes.
  Three theme-independent tokens (`text-art`, `text-art-muted`, `text-art-accent`) replaced them:
  measured 19.72 / 11.81 / 10.37 against the scrim, identical in both themes, because they no
  longer depend on the theme at all.
- **No focus ring on the tiles.** `BaseButton` has one; the tile links, the wide rows and
  "Ver todo" fell back to the UA outline over photography. They now carry the same
  `focus-visible:ring-2 ring-primary` contract.
- **"Ver todo" measured 49×16** — under the WCAG 2.2 AA 24×24 minimum. It is now
  `inline-flex min-h-[24px]`. Re-measured: zero interactive elements inside the mosaic under 24px
  on either axis.

Contrast was computed from the real computed `color` values with an `oklch` → sRGB conversion, not
sampled from a screenshot: the browser returns `oklch()` strings, so an `rgb()`-only parser silently
returns `null` and reports nothing. That was caught before any number was trusted.

**L19** — Independent verification (`gentle-ai-verify`), ego lite, 8 loads: `/`, `/movies` and
`/series` at 1440 and 390, dark and light. Every threshold passed: 4 mosaic tiles, **0 overlapping
pairs**, **0 px horizontal overflow**, exactly one `h1` equal to the lead title, **0 undersized
targets** inside the mosaic, 1 rail per catalog page (4 real sections on `/`, per L15), 0 console
errors or exceptions, and text-over-art contrast 19.72 / 10.37 / 10.37 / 19.72 in both themes. It
independently re-derived the pre-fix failure by stripping `text-art` in the light theme: 23,23,23 on
3,3,8 = **1.15:1**, which is why the comment in `style.css` says 1.15 and not the 1.4 this session
first estimated.

**L20** — What this slice does **not** prove, recorded rather than assumed:

- No test runner exists in this repository (no vitest/jest, no `*.test.*`), so verification is
  structural plus real-browser measurement. A regex test over `style.css` would only restate the
  source, so none was added as a substitute for behaviour.
- `AnimeView` is verified only in the sense above; the anime data source returned nothing during the
  run, so its hero CTA was never exercised with real content.
- Skeleton states were migrated and observed to clear after load, but never captured mid-load.
- The artboard's own ornaments still differ from the implementation and are **deliberate
  follow-ups**, not oversights: the "VUMIES" watermark, the 0.92-alpha badge plate, a 16:9 art tile
  for the wide band (it renders a real title list instead, because the wide data the views have is a
  list and not a fourth piece of art), the 12px mobile gap (the contract's `--grid-gap` is 18/24px)
  and the 40px lead title (the component uses 30/48px).
- Cross-collection repeats remain: TMDB returns the same title in trending, now playing and popular,
  so a poster can appear in two different real rails. That is data, not duplicated markup, and
  removing it would mean hiding real content from real sections.

**L21** — Human feedback on the result: "No me gusta como se ve proximos estrenos, es todo feo, no me
gusta rediseñalo, tambien que todo este correctamente alineado y que nada choque entre si, tengo todo
su espacio, no este muy saturado, los button de navbar no tengan ese border azul, hazlo con taste
skill y audita con impeccable."

Redesign, as one slice:

1. **"Próximos estrenos" was a boxed text list inside the mosaic.** Three text rows with a truncated
   title, a score and a year, inside a `bg-card p-5` plate: its own padding and its own radius put it
   off the grid lines the rest of the mosaic follows, and it read as a form, not as a catalogue. It is
   now a full-width row header (title on the leading edge, action on the trailing edge, no box, no
   padding) plus three 16/10 art tiles in the same six-column grid, with the same scrim, radius and
   text-over-art tokens as the tall tiles and less weight on hover. The data was already there
   (`artwork`, `meta`, `year` were computed and never rendered); no request was added.
2. **The blue edge on the navbar.** The top-bar controls carried `ring-1 ring-border/60` at rest and
   `focus-visible:ring-primary/50` when focused — a violet-tinted hairline and a violet halo on a
   translucent plate, which is what read as a blue border. The resting hairline is gone (the surface
   and blur stay, which is what carries the contrast the earlier audit measured) and the focus ring
   is neutral in both themes: measured on keyboard focus, `oklch(0.985 0 0 / 0.3)` 2px. The sidebar's
   nav rows had the same violet ring and now use the same neutral one.
3. **Audit findings, resolved.** The impeccable detector (URL mode, not just source) found, on all
   three routes: `hero-eyebrow-chip` on the tracked-caps label above the lead `h1`, and
   `undersized-ui-text` on the 10px tile badges. The kicker is removed (it duplicated the badge and
   the detector bans the pattern outright; the `leadKicker` prop is gone, not hidden) and the badge
   is `text-[11px]`. Re-run: the only remaining finding is `overused-font` (Inter), **waived**: the
   typeface is the app's existing identity, it predates this feature and changing it would touch every
   screen, which is a brand decision and not part of "redesign this band".

Taste-skill rules applied where they fit an Operate surface: equal left and right content edges, one
rhythm, nothing colliding, no caption or label under a picture, one card family, hover and focus that
answer, 44px-class targets on a phone. Its brand rules (no violet) do **not** apply: violet is
Vumies' existing accent, and the brief keeps it.

Measured after the change, 12 loads at 1440/1024/768/390 on `/`, `/movies` and `/series`:
**one column gap and one row gap per width** (24px from 768, 18px at 390 — `--grid-gap` in both
axes), every piece snapping to a grid column line (left offsets 0/453/905/1132 at 1440, right edges
ending on column lines or the container edge), **0 overlapping pairs**, **0 px horizontal overflow**,
7 mosaic children, one `h1` per page. `vue-tsc` and `vite build` clean. Verified structurally and by
measurement, not by eye: this session cannot view screenshots.

**L22** — Two follow-ups from the human, in one slice:

1. **"Falta alinear las scroll de peliculas en el inicio como en las demas vistas."** Measured before
   touching anything: every rail on every view started its first poster at `x = 0`, one full gutter
   left of the container's content edge (48px at 1440, 16px at 390) — home was not the outlier, all
   rails were. Root cause: `.rail` cancels the gutter with a negative margin and pads it back, but a
   scroll container's `scroll-snap-align: start` snaps to the **snapport**, which is the padding box,
   so the browser scrolled the rail by exactly one gutter and ate the leading padding (measured
   `scrollLeft: 48`). Fixed with `scroll-padding-inline: var(--gutter)`. After: heading x, first
   poster x and the container's content edge are the same number on `/`, `/movies` and `/series` at
   1440 (48) and 390 (16), `scrollLeft: 0`, alignment delta 0.
2. **Ambilight behind the poster on hover**, fast and cheap. `.ambilight` is one absolutely
   positioned layer per card holding the card's own poster as a blurred background (`blur(20px)
   saturate(1.3)`), fading `opacity 0 → .55` while it settles `scale(.94) → 1`, on `:hover` and
   `:focus-within`, with the parent `isolate` so `z-index: -1` stays behind the frame and
   `pointer-events: none` keeps it out of the hit test. The three performance rules are the contract:
   no new request (it reuses the cached poster URL), lazy priming (`background-image` is bound only
   after `mouseenter`/`focusin`, so 40 cards cost nothing at rest) and compositor-only animation
   (`opacity` + `transform`, `will-change` only while hovered).

Measured with ego lite, 1440 and 390: 0 of 74 ambilight layers primed after load and 12 image
requests before hovering, **12 after** (one hover primes exactly one layer); `opacity 0 → 0.55`,
`transform 0.94 → 1`, `filter blur(20px) saturate(1.3)`, `z-index -1`, `pointer-events none`, card
`isolation: isolate`. Steady-state hover cycles on three different cards: **0 layouts and 1 style
recalculation per enter, 0 and 0 per leave**. `vue-tsc` and `vite build` clean; the impeccable
detector on the three rendered routes reports only the already-waived `overused-font`.

Not measured: real frame timing on a low-end device, and touch behaviour (the effect is hover-only
by nature; `pointerenter` on tap primes a layer but shows nothing until the next hover).

**L23** — Human report: "Cuando se activa el hover o el scale en el poster, este se rompe arriba al
chocar... el poster se corta."

The numbers, measured before touching anything: `.rail` sets `overflow-x: auto`, and the spec makes
`overflow-y` compute to `auto` too, so the rail is a clipping box in both axes while carrying only
`padding-block: 0.25rem 0.5rem`. On hover the card lifts 2px (`.motion-card`) and the frame another
2px (`group-hover:-translate-y-0.5`), which put the poster's top edge at `figure.top = 892` against a
rail top of `892` — flush with the clip line, so rounding cut the first rows — and the ambilight,
which started at `-8%` (`top = 863`), was cut by 29px of hard horizontal edge right above the poster.
That hard line is what the screenshots showed.

Fixed in two places, and the second one matters as much as the first:

1. `.rail` gets `padding-block: 0.75rem 0.5rem` (12px top). The lift now has 8px of air inside the
   clip box. This does move every rail's cards 8px down, which widens the heading-to-cards gap from
   16 to 24px — the same number as `--grid-gap`, so the rhythm improves rather than drifts.
2. `.ambilight` starts at `6%` inside the poster's top edge instead of `-8%` above it, with
   `blur(18px)`. The blur bleeds about 1.4x its radius, so the painted halo top lands ~3px inside the
   clip box: it is now **structurally impossible** for the glow to be cut above the poster, whatever
   the card size is. The light spills sideways and below, which is where an ambilight reads.

Verified twice. By measurement: on hover `figure.top = 227.9` against `rail.top = 219.9` (8px of
headroom instead of 0), the glow rect starts 25.3px inside the poster, and `scrollHeight ==
clientHeight == 408`, so the rail is not scrolling vertically at all. And visually, by a subagent that
can actually read the screenshots (this session's model cannot): BEFORE, "a hard horizontal edge at
y≈219→220, page background (10,10,12) jumping straight to (0,0,0), nothing above the poster"; AFTER,
"the top edge is intact... no cut line and no band above" with the glow ramping smoothly
(10,16,21)→(14,34,40) in the side gaps, no collision with the "Tendencias" heading (40px clear), the
neighbours or the row below, and "nothing broken or ugly".

Two things recorded rather than smoothed over:

- The rail's halo reads weaker than the grid's in the stills. That is the posters' own colours, not a
  different recipe. A larger halo above the poster is possible, but it would need more rail headroom,
  which shifts every rail down again; the current geometry is the biggest spill that fits uncut.
- The reviewer could not tell whether the hovered card's title colour in the grid capture was
  mid-transition; it was not re-verified because it is pre-existing card behaviour and outside this
  report.

**L24** — Three requests in one slice: fluid rails, exact image sizes in a modern format, and the
permanent ambilight on the mosaic's first tile.

1. **The carousel was not janky because of JS: it was snapped.** The rail animated with a rAF loop
   writing `scrollLeft` per frame, and `.rail` carried `scroll-snap-type: x proximity`. Measured in
   Chrome by sampling `scrollLeft` once per animation frame around a real arrow click: with snap
   enabled the scroll resolved in **1 distinct position across 32 frames** (an instant jump to the
   snap point); with snap removed, **32 distinct positions** with a smooth easing curve. So the JS
   rewrite alone would not have fixed the feel. What changed:
   - snap removed from `.rail` (and the now-inert `scroll-snap-align` on its children);
   - the arrow handler uses native `el.scrollTo({ behavior: 'smooth' })` instead of a rAF loop
     writing `scrollLeft` — the browser animates in its own pipeline and we stop touching layout 60
     times a second; the reduced-motion path still jumps instantly;
   - the step is rounded to a whole card pitch (measured landing 976 = 4 x 244), so the rail still
     lands card-aligned without paying the snap cost;
   - the scroll handler is rAF-throttled and `scrollWidth`/`clientWidth` are cached and remeasured
     only on resize/mutation, so scrolling no longer does a layout read per event.
   Trade-off: touch momentum no longer snaps to cards. That is the fluidity the request asked for.
2. **WebP: nothing to convert, everything to size.** `curl -H "Accept: image/webp"` against TMDB
   returns `image/webp`, and browsers already send that header, so the app was already receiving WebP
   (measured: `w342` 37.6 KB webp vs 53.8 KB jpeg). A conversion pipeline or proxy would have been
   infrastructure for a problem that does not exist. What was wrong is the width: one fixed size per
   role. Now `getPosterSrcSet` (w185/w342) and `getBackdropSrcSet` (w780/w1280) plus `sizes` per slot,
   and `LazyImage` applies `srcset` **only on reveal** — an `<img>` born with `srcset` downloads at
   parse time and would defeat the component's deferred loading. Measured selection: 160px card at
   390 DPR1 → `w185` (13.5 KB instead of 37.6 KB, -64%); 220px card at 1440 DPR1 → `w342` (unchanged,
   so nothing got blurrier); mosaic wide tile at 429px → `w780` (62 KB instead of 132 KB, -53%, three
   per page); mosaic lead at 881px → `w1280` (unchanged, it genuinely needs it).
3. **Permanent ambilight on the first mosaic tile only.** The lead is wrapped in its own `isolate`
   container with an `.ambilight.is-static` layer (the article clips with `overflow-hidden`, so the
   glow cannot live inside it). It reuses the lead's own artwork URL — no extra request — at
   `opacity .55`, `blur(24px)`, and a symmetric spill of `-3% -4%` (`-3% -5%` from 768).

Two defects found by measuring instead of assuming, both fixed:

- The first version spilled `-7%` sideways, which at 390 put the glow 9px past the viewport and opened
  **horizontal scroll on all three routes** (measured `hScroll: 9`, `innerWidth` reporting 399). The
  spill is now bounded by the gutter it has to live in.
- A vision review of the rendered frames reported the desktop halo as "a coloured patch at the left
  edge, cut by the window" and the phone halo as invisible. The geometric cause was the same: the
  inset exceeded the gutter on the left while the neighbouring tile simply covers the right side. The
  final numbers are each side's available space (64px above, `--grid-gap` below, gutter sideways),
  measured spill 44/44/12/12 px at 1440 and 14/14/13/13 at 390, fully inside the viewport, with the
  blur raised to 24px so the falloff happens inside that band.

Verified: `vue-tsc` and `vite build` clean; 12 geometry loads at 1440/1024/768/390 across `/`,
`/movies` and `/series` (7 mosaic pieces, one column gap and one row gap per width, 0 overlapping
pairs, 0 px horizontal overflow, one `h1`); srcset selection measured at 1440 DPR1, 1440 DPR2 and 390
DPR1; the static glow measured at 1440 and 390; impeccable detector on the three routes reports only
the already-waived `overused-font`.

**L25** — Series detail redesign (`/serie/:id`), the navbar/title collision and two rounds of visual audit.

1. **Root cause, measured.** The top bar was `position: fixed` at y=12, height 48, with computed
   `background: transparent`, `backdrop-filter: none`, `border: 0` and no shadow, and the `<h1>` also started at
   y=12 — they shared a top edge. At 390px the overlap was 22 real pixels and the hamburger sat on the "D" of the
   title. The bar floated naked over the hero art.
2. **Fixed by construction.** The title is in normal flow below `--chrome-top` (no absolute, no negative margins) and
   the route renders a fixed surface behind the bar (`oklch(0.165 0.005 285 / 0.95)` + `blur(12px)`, 64px tall,
   `pointer-events: none`). Measured after: header→h1 gap 232px at scroll 0, **intersection null** at scroll 0, at
   scroll 500 and at 390px.
3. **Other real defects the audit found and that were fixed:** the metadata printed "1 Temporadas"; episodes without
   `still_path` rendered a broken `<img>` with clipped alt text over the number badge (12 of 23 counted as broken until
   lazy loads finished — now a token placeholder, 0 broken); "Sin descripción disponible." repeated on most rows;
   there was no primary action at all, only a secondary "Mi Lista" (now a real `Reproducir` on the selected season's
   first episode, no invented progress); no container, so rows stretched 1344px wide.
4. **Two audit rounds, applied, not argued.** Round one: hero full-bleed instead of a card (the card "read as a card,
   not a title page" and produced three different left edges), a real gap above the hero, opaque surface so the hero
   buttons stopped ghosting through the bar, measured bottom clearance for the phone pill, episode rows aligned to the
   start with a reserved meta slot and one badge treatment, quieter placeholders, equal-width hero buttons at 390, and a
   constrained synopsis so it never sits over bright art. Round two measured the result: **one optical edge** (h1 and
   "Episodios" both at 56px desktop / 16px mobile), one `<h1>`, no horizontal overflow.
5. **Sections added with real data only:** Episodios, Reparto Principal, Te Recomendamos.

Checks: `vue-tsc` clean, `vite build` clean, impeccable detector `[]` on both files, `SerieHero.vue` added as the only
new component.

**L26** — Third audit round, applied. Four defects, four fixes, all measured after.

1. **The hero art began on a hard line at y≈88** (a dark strip above it, and the character's head cropped at 390). The art now begins at **y=0**, behind the fixed surface, with a background→transparent gradient over the chrome height; the text block keeps its offset (`--chrome-top` + one spacing step). Measured: `artTop 0`, header→`<h1>` gap **144px** at scroll 0 — further from the bar than the 28px minimum the construction guarantees.
2. **The phone pill cut the footer links** ("Comedia" read "Come…"). The clearance only existed in the view, so `AppFooter.vue` got the same measured constant, mobile-only, with `md:pb-20` untouched. Measured at 390: pill at 758–828, last footer link "Terror" at 556–580 — clear, and it gets further from the pill the deeper the page scrolls.
3. **E6/E7 printed their number twice** (centred label + corner badge). The tile is now a quiet box and the badge is the only number.
4. **A faint purple ghost survived the 0.95 surface** (x≈60–230, y≈0–40 — the primary button bleeding through the blur). The surface is now fully opaque `oklch(0.165 0.005 285)`, blur kept for the transition. A solid surface beats glass that leaks.

**Deliberately not "fixed":** E6/E7 have no `runtime` and some rows have no synopsis. Their slots stay reserved and empty — printing "Duración N/D" would be the same filler the first audit flagged, and the reserved slot is what holds every row at one height.

Checks: `vue-tsc` clean, `vite build` clean, impeccable `[]` on all three files (`SerieHero.vue`, `SerieDetailView.vue`, `AppFooter.vue`).

**L27** — Fourth and fifth audit rounds: the surface I made opaque was itself the defect, and the observer was lying.

1. **Round 4** reported the opaque surface as a slab: it cut the hero art flat at y=64 (a planet sliced in half) and left a
   tonal step when scrolled. The right pattern is a **conditional surface**: no surface at the top of the page, so the art
   shows through and cannot be sliced; the surface fades in once the page scrolls, and by then the art is no longer behind
   it, so nothing can ghost. Also: the phone pill still hid the copyright line, and the empty episode tiles read as failed
   images. The worker implemented the conditional surface, added a second clearance step to `AppFooter.vue`, and gave the
   empty tile a deliberate treatment (muted surface, inset hairline, faint play glyph, badge as the only number).
2. **Its IntersectionObserver never worked, and I found that by measuring.** Two failed attempts are recorded because both
   are real traps:
   - With a **1px sentinel** at the hero's foot, Chrome reports `isIntersecting: false` at rest (zero-area edge case), so the
     surface was pinned on from the first frame.
   - Swapping to a **sentinel as tall as the chrome** fixed the flag but added 64px of real layout height (the `h1` moved
     205 → 268) and its first callback ran before layout, with `bottom === 0`, which satisfied a `<= 0` test — surface on
     again.
   - Final, deterministic fix: **no sentinel at all**. A passive `scroll` listener writes `window.scrollY > 24` into the
     ref and only touches it when the boolean flips, so there is no work per frame and no observer boundary to be wrong
     about. Measured after: **surface opacity 0 at scroll 0** and **1 at scroll 400**, with the `h1` back at 204 and a
     144px gap to the bar.
3. **Fourth round, otherwise confirmed:** no ghosting left, footer links clear of the pill, no horizontal overflow.

Checks: `vue-tsc` clean (after removing the now-unused `nextTick` import), `vite build` clean, impeccable `[]` on all three
files, and screenshots `temp/ego-play/serie-v6-*.png`.

**L28** — The last audit question was answered by measurement, and it was a real bug I had introduced: with the header's own
hide-on-scroll, my surface stayed behind as an empty 64px dark band.

The surface now follows the chrome, not only the scroll position: it is on only when `window.scrollY > 24` **and** the header
is actually on screen (`header.getBoundingClientRect().bottom > 8`), evaluated inside a `requestAnimationFrame`-coalesced
passive listener so there is still no work per frame. Measured across the three states:

| state | header | surface |
| --- | --- | --- |
| top (y=0) | 12→60, visible | **0** |
| scrolled down (y=900) | −52→−4, hidden | **0** — no empty band |
| scrolled back up (y=539) | 12→60, visible | **0.84** mid-fade → 1 |

The vision audit also confirmed the original defect is gone: across the top 100px the art runs continuously, with the
planet's top edge, its glow and the rim light unbroken through y≈64 — no slab, no band, no seam, and nothing broken at the
top of the page. Verdict from the reviewer: the top of this page no longer reads as a layout bug.

Accepted, documented data limitations (not defects): episodes without `runtime` keep an empty reserved duration slot, and
rows without a synopsis stay sparse — the reserved slots are what hold every row at 143px, and filler text was the first
thing the audits flagged.
