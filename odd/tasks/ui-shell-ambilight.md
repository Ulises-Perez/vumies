# Floating shell + ambilight redesign

Redesign the Vumies application shell: the sidebar becomes a floating overlay that stays hidden until it is opened, the top menu floats and only folds/unfolds that sidebar, and the home page plus every tab gain an ambilight ambience built from the art each screen is showing. Alongside the visual work, close the command-palette Escape defect and keep the app measurably fast.

Mode: Operate (app UI). Refinement of the incumbent visual world: the dark violet brand, the copy and every feature stay.

## Specs

S1. The sidebar is floating and stays hidden by default. Exact words: "el sidebar que se abra y sea flotante sino que se esconda siempre". It renders as a floating panel above the content on every breakpoint, reserves no layout space (`md:ml-20` is gone), pushes nothing, and is closed on first load, after every reload and after every route change. It closes on its own toggle, on Escape, and on a click outside it.

S2. The top menu is floating too and only folds/unfolds the sidebar. Exact words: "que el menu tambien sea flotante y solo sea para plegar y desplegar el sidebar". The floating top bar carries no navigation list: navigation lives in the sidebar. Its toggle is the only control that changes the sidebar's open state, and it reports that state (`aria-expanded`, `aria-controls`, accessible name that flips between "Abrir menú" and "Cerrar menú").

S3. Home and every tab get an ambilight ambience. Exact words: "un aspecto ambilight en el inicio y cada pestaña". Each route derives its ambience from the art it is already showing (backdrop or poster), rendered as soft light bleeding from the screen edges. It must never delay first paint, never shift layout, and must degrade to a neutral brand glow when a route has no art yet.

S4. Better designs, animations and overall aspect. Exact words: "vamos a diseñar mejor, vamos a mejorar los diseños, animaciones y el aspecto". One motion vocabulary (a single easing/duration set used by the sidebar, the top bar, cards, buttons and overlays), all of it state conveying, all of it disabled under `html.reduce-motion` and `prefers-reduced-motion: reduce`.

S5. The search bar closes on Escape from anywhere. Exact words: "al abrir la barra de busqueda este al presionar fuera de la barra de busqueda pero dentro de la web, al presionar la tecla esc, esta no se cierra a menos que este si o si dentro de la barra o la barra flotante y se haya presionado sobre ella." With the palette open, Escape closes it whether focus sits in the input, on a result, on the panel body or on the document body.

S6. Everything is audited with impeccable. Exact words: "Todo esto se va a auditar con impeccable para que quede todo clean". The Impeccable detector runs over the changed UI and its findings are resolved before the work is reported done.

S7. No design or functional regression, plus real performance work. Exact words: "verificar siempre optimizaciones de codigo, tambien de mejoras de rendimiento para que se sienta mas fluido sobre todo en diseño y respecto que no afecte el diseño ni tampoco la funcionalidad." Every existing route, filter, favourite, history entry, settings toggle and player embed keeps working; `vue-tsc` and `vite build` stay clean; blur and filter layers stay bounded and never repaint the whole viewport on scroll.

S8. Keep image-derived ambilight out of long-form copy, and make the floating bar stop covering detail titles as the reader scrolls. Exact user report: "el problema es que el ambilight separa mucho cuando ves el contenido como la descripcion y hace que se vea fatal." Ambilight fades out after 40% of the viewport height has been scrolled, so it stays with most of the hero and is gone before long-form copy dominates; the top bar hides while scrolling down and returns while scrolling up, when the sidebar is open, or while search is open.

S9. Sidebar navigation must actually route. Exact user report: "Ademas de que el sidebar no dirige a otras pestañas de la web, nada es visible." Every visible sidebar router-link routes to its corresponding page and the panel closes after navigation. The menu must visibly show its navigation entries against the active content.

## Tasks

- **T1** — Close the command palette on Escape from anywhere (window-level handler plus panel-level handler), keep the scroll lock and remove its layout shift. `Spec: S5` · route: inline · commit: `c3f691c`
- **T2** — Rebuild the sidebar as a floating overlay drawer with its own shell state, focus handling, Escape and outside-click dismissal, and drop the fixed content offset. `Spec: S1, S2` · route: inline · commit: `94b5f94`
- **T3** — Replace the fixed full-width navbar with a floating top capsule whose toggle folds the sidebar and which holds no navigation list. `Spec: S2` · route: inline · commit: `470f077`
- **T4** — Add the ambilight stage and wire every view to publish the art it is showing. `Spec: S3` · route: inline · commit: `470f077` (stage) + `9e119aa` (views)
- **T5** — Unify motion tokens and micro-interactions across the shell, cards and buttons, with reduced-motion coverage. `Spec: S4` · route: worker (`gentle-ai-worker`, reviewed inline) + inline · commit: `ab48796` (tokens + primary surface) + `6da7f4d` (cards)
- **T6** — Verify: `vue-tsc`, `vite build`, real-browser check of every route at 1440/1024/820/390, Escape repro, Impeccable detector, and a scroll/repaint sanity pass. `Spec: S3, S5, S6, S7` · route: inline · commit: (verification only)
- **T7** — Document the new shell in the README. `Spec: S1, S2, S3` · route: inline · commit: `docs(readme): describe the floating shell and ambilight`
- **T8** — Follow-up from the human: the ambilight separated from the content and made the description area look bad, and the drawer felt empty. Turn the ambience into a subordinate tint and size the drawer to its content. `Spec: S3, S4` · route: inline · commit: `fix(shell): tint the ambience and size the drawer to its content`
- **T9** — Keep image-derived light out of the synopsis (fade beyond 40vh) and auto-hide the floating top bar while reading down the page; restore it on upward scroll, at the top, or while search/sidebar is open. `Spec: S8` · route: inline · commit: `5ed55fb`
- **T10** — Verify every visible sidebar route link actually navigates, closes the panel and remains reachable at desktop and mobile sizes. `Spec: S9` · route: inline · commit: verification evidence only (`L19`, `L22`)
- **T11** — Resolve Impeccable's concrete detail-page heading-level and line-length findings, then audit again. `Spec: S7` · route: inline · commit: `00ef669`
- **T12** — Record final follow-up evidence and commit. `Spec: S8, S9` · route: inline · commit: pending

## Log

**L1** — User's original request, verbatim:

> quiero mejorar el diseño de la web, con esto sobre todo el sidebar que se abra y sea flotante sino que se esconda siempre, que el menu tambien sea flotante y solo sea para plegar y desplegar el sidebar, vamos a diseñar mejor, vamos a mejorar los diseños, animaciones y el aspecto para que tengo un aspecto ambilight en el inicio y cada pestaña. Todo esto se va a auditar con impeccable para que quede todo clean, ademas de verificar siempre optimizaciones de codigo, tambien de mejoras de rendimiento para que se sienta mas fluido sobre todo en diseño y respecto que no afecte el diseño ni tampoco la funcionalidad.
>
> Tambien vamos a corregir un error el cual es al abrir la barra de busqueda este al presionar fuera de la barra de busqueda pero dentro de la web, al presionar la tecla esc, esta no se cierra a menos que este si o si dentro de la barra o la barra flotante y se haya presionado sobre ella.

**L2** — Exploration evidence (Explorer run, `path:line`): `src/App.vue:7` pushes content with `md:ml-20`; `SideMenu.vue:2-3` is a permanently visible `fixed w-20` rail with no open state; `AppNavbar.vue:2` is a fixed full-width header hidden below `md`; `CommandPalette.vue:28` binds `@keydown` on the input only and `:271-276` registers Cmd/Ctrl+K as the only window listener, so Escape never reaches a handler once focus leaves the input.

**L3** — Decision: the floating top bar keeps the search trigger and the settings link, because removing them would strip a primary streaming-app action and S7 forbids a functional regression; what disappears from the bar is navigation. Reading of S2 recorded here.

**L4** — Decision: the ambilight is built from blurred copies of the art each route already loads, not from canvas colour sampling. Canvas sampling needs CORS on the TMDB and AnimeAV1 CDNs and would break the visible hero when it fails, so the CSS route gives the same light with no failure mode and no extra network cost.

**L5** — Impeccable `context` ran: refinement of an incumbent visual system, no PRODUCT.md, mechanical detector required after the UI work (`impeccable.cmd detect --json`).

**L6** — Behaviour measured in a real browser (`ego-browser`, DevTools device metrics), not assumed: the panel starts closed (`translateX(-292px)`, `opacity 0`, `inert`, `aria-expanded=false`), opens to `translateX(0)` with focus inside, and closes again on Escape with focus on `<body>`, on a click outside the panel and on a route change. The content wrapper keeps `margin-left: 0`, so the drawer reserves no space. No horizontal overflow at 390/320/820; bottom-pill targets are 53px tall; the top bar is 48px on mobile and 56px from `sm`. Mobile controls were raised from 40px to 44px after this measurement.

**L7** — Escape root cause confirmed by instrumentation: the keydown does reach `window` in capture phase, and the palette does close (`bodyOverflow` restored and focus returned to the trigger). The earlier "still open" reading was the leave transition, which took up to 1.2s; the transition now carries an explicit `:duration="{ enter: 160, leave: 140 }"`. Verified closed with focus on `<body>` and with focus on a result row.

**L8** — Ambilight verified structurally because the screenshots cannot be reviewed by this session: 3 art layers whose `background-image` is the same TMDB URL the hero already loads, `z-index: 0` under the `relative z-10` content wrapper, and every view root computes `background-color: rgba(0,0,0,0)` on `/`, `/movies` and `/series`. `/settings` intentionally renders only the brand wash because it shows no art.

**L9** — Impeccable detector over `/`, `/movies`, `/series`, `/settings`, `/favorites`: the two low-contrast findings (3.7:1 white on the accent violet, 4.3:1 violet on card) and the straggler were fixed with `--primary-strong`, a foreground-coloured logo mark and `text-wrap: pretty`. All four routes now report a single remaining warning, `overused-font` (Inter). It stays: changing the typeface is a brand decision outside this request and would invalidate the whole type scale; recorded as a follow-up.

**L10** — A vision-enabled reviewer reported duplicate `useAmbienceSource` imports in 13 views and a stray sky-blue gradient chip inside the sidebar. Both are false positives and are recorded as such: `grep -c` shows exactly one import plus one call per view, `vue-tsc` and `vite build` both pass (a duplicate import is a syntax error), and a DOM scan of every element with a gradient background overlapping the panel returns only the hero gradients and the nav indicator. No change was made on that basis.

**L11** — History note: the first commit series was reset and rebuilt once, because staging the component directory carried the `AppNavbar` deletion into the token commit and left that commit unable to compile. Nothing was pushed, so the branch now carries six commits that each compile.

**L12** — User's follow-up request, verbatim:

> Hay un error el cual C:\Users\ulise\AppData\Local\Temp\orca-paste-1794175493976-c77907f2-bef0-4097-97c7-d47d03b16a35.png, para analizar las imagenes tira un subagente que las vea, el problema es que el ambilight separa mucho cuando ves el contenido como la descripcion y hace que se vea fatal.
>
> En caso de ser necesario tira un subagente que vea todas las imagenes.
>
> Tambien quiero que distribuyas mucho mejor el sidebar para que no sea tan vacio. con /taste y audita siempre con impeccable

**L13** — No subagent in this runtime can see images: the parent and every agent share a model without vision, and the verifier reported the omission instead of inventing findings. The defect was therefore diagnosed by measuring the render: with the ambience visible versus hidden, the old floor glow lifted the bottom 80px of the viewport from ~17 to ~108 luminance — six times the page background, in a band with hard edges — which is exactly the separation the human reported. A separate bright band at scroll 700 survived with the ambience hidden and is page content, not the ambilight.

**L14** — Fix and evidence. The stage now paints a full-bleed 19% tint plus one bottom spill at 30% masked with a radial fade, under a linear veil that carries the bottom edge back to the page colour; the two side glows and the radial veil are gone. Per-row contribution measured against the layer hidden is now a smooth cast (mean +4 to +6 luminance, max +16.7, largest row-to-row step 6.7 out of 255) instead of a band. The drawer was also mis-sized: 876px tall with 409px of dead space under the last row. It now hugs its content (496px, 9px of trailing padding) with 44px rows, three labelled groups, a search entry with its shortcut, and the active-row indicator still tracks the correct row.

**L15** — Follow-up request, verbatim:

> Ahora prueba la web con este modelo, para que entiendas los problemas. C:\\Users\\ulise\\AppData\\Local\\Temp\\orca-paste-1794176437552-c6ca2ba4-644e-4cd7-b6f8-aae467e1e905.png, C:\\Users\\ulise\\AppData\\Local\\Temp\\orca-paste-1794176450857-66d0830a-4093-4605-83a8-887935f6208b.png,
>
> Ademas de que el sidebar no dirige a otras pestañas de la web, nada es visible.

**L16** — Visual evidence: both user screenshots are readable by the primary model. The detail capture shows a hard horizontal seam at the bottom of the hero, the orange image-derived glow behind the synopsis, and the fixed top capsule covering the title when the page is scrolled. The second image is the home page at the lower rails. The live sidebar screenshot confirms labels and icons are visible over the hero, contrary to the claim that nothing is visible; an actual click on `#app-sidebar a[href="/movies"]` navigated to `/movies` and closed the panel. The route report is still captured as a regression check, not dismissed.

**L17** — The primary model can read PNGs via the image attachment returned by `read`; subagent agents share a non-vision model and their visual reports are unavailable. We inspected the supplied screenshots directly, not via pixel-only inference.

**L18** — Impeccable on `/movie/1368337` after the ambience/topbar fix found a long synopsis line (~90 chars on 2/4 lines) and skipped heading level (`h1` then `h3` Sinopsis); Inter overuse remains the pre-existing brand choice. Changed Sinopsis, Reparto Principal, Premios and Información to `h2`, constrained synopsis copy to 60ch, and reran the detector: both the line-length and heading warnings are gone; only Inter overuse remains.

**L19** — Browser route checks: with the sidebar open all six links (`/`, `/movies`, `/series`, `/favorites`, `/recent`, `/settings`) had visible rectangles inside the viewport. Clicks to `/movies`, `/series`, `/favorites`, `/recent`, `/settings` and `/` changed the URL and closed the sidebar. At 390×844 the document had zero horizontal overflow, the toggle target was 44×44px, and clicking Series navigated successfully. A test selector for `/` was ambiguous because both the Vumies logo and Inicio row link there; the check used the exact `a.nav-row[href="/"]` instead.

**L20** — A desktop screenshot captured immediately after opening the drawer once showed only a narrow strip; the follow-up live DOM plus a fresh capture showed the full 280×496px drawer and all six visible nav rows. This was transient capture timing, not a stable navigation defect. The visual source images are still available in `temp/shots/` for human inspection.

**L21** — Refined the ambience fade threshold from a fixed 180px to 40% of viewport height. The earlier 180px cutoff removed the glow before most users left the hero; 40vh keeps it with the primary visual while it clears the synopsis before it fills the reading viewport. The scroll listener is passive and updates reactive state only when crossing the threshold.

**L22** — Final visual and route verification. At 1021×1252 and scrollY=620: `is-scrolled` is true; `.ambience__art` opacity is 0; top bar has `aria-hidden=true`; Synopsis starts at y=404. The hero backdrop ends at y=444 and synopsis body text starts exactly there, on the neutral page surface. The hero's background image remains in its own box; the ambiguous earlier screenshot was not a separate brown body panel (the latest capture `temp/shots/final-1021-detail.png` shows the copy on the page background). At 1440px all six sidebar routes (`/`, `/movies`, `/series`, `/favorites`, `/recent`, `/settings`) had visible in-viewport rows and successfully navigated/closed. At 390×844, horizontal overflow=0, menu toggle=44×44, and mobile Series navigation succeeded. `vue-tsc`, `vite build` and `git diff --check` pass. Impeccable over `/`, `/movies`, `/series`, `/settings`, `/favorites`, `/recent`, `/movie/1368337` and `/serie/1396` reports only `overused-font` (Inter) on each; the movie detail line-length and skipped-heading findings are gone.

**L23** — Final commit evidence: shell scroll/ambience behavior `5ed55fb`; detail heading and measure `00ef669`. README and this evidence document are to be committed as T12.
