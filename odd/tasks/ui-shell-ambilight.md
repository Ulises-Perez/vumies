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

## Tasks

- **T1** — Close the command palette on Escape from anywhere (window-level handler plus panel-level handler), keep the scroll lock and remove its layout shift. `Spec: S5` · route: inline · commit: `c3f691c`
- **T2** — Rebuild the sidebar as a floating overlay drawer with its own shell state, focus handling, Escape and outside-click dismissal, and drop the fixed content offset. `Spec: S1, S2` · route: inline · commit: `94b5f94`
- **T3** — Replace the fixed full-width navbar with a floating top capsule whose toggle folds the sidebar and which holds no navigation list. `Spec: S2` · route: inline · commit: `470f077`
- **T4** — Add the ambilight stage and wire every view to publish the art it is showing. `Spec: S3` · route: inline · commit: `470f077` (stage) + `9e119aa` (views)
- **T5** — Unify motion tokens and micro-interactions across the shell, cards and buttons, with reduced-motion coverage. `Spec: S4` · route: worker (`gentle-ai-worker`, reviewed inline) + inline · commit: `ab48796` (tokens + primary surface) + `6da7f4d` (cards)
- **T6** — Verify: `vue-tsc`, `vite build`, real-browser check of every route at 1440/1024/820/390, Escape repro, Impeccable detector, and a scroll/repaint sanity pass. `Spec: S3, S5, S6, S7` · route: inline · commit: (verification only)
- **T7** — Document the new shell in the README. `Spec: S1, S2, S3` · route: inline · commit: `docs(readme): describe the floating shell and ambilight`

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
