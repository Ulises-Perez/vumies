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
- **T10** — Extract the inline mosaic from `MoviesView` and `SeriesView` into one `MosaicHighlights` component with a normalized view model, and migrate both views to it. `Spec: S5, S6, S9` · route: writer
- **T11** — Rebuild the home route on that mosaic: hero removed, mosaic first, real rails kept with the mosaic's own items de-duplicated. `Spec: S9` · route: writer
- **T9** — Update `README.md` and close this document with the commits that hold each task, after T10 and T11. `Spec: S7` · route: inline

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
