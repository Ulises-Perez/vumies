# Vumies design system

Captured from the project's own sources. Every entry names the file it came from. Nothing here is
invented: if a value is absent from the sources, it is absent here too.

Sources read: `src/style.css` (CSS custom properties, component classes, motion), `tailwind.config.js`
(Tailwind theme mapping), `src/modules/ui/components/base/*.vue` (primitives).

Stack: Vue 3 + Vite + Tailwind CSS v3 (`@tailwind base/components/utilities`), `darkMode: 'class'`.
Theme is switched by adding `.dark` to `<html>` (`src/core/stores/settings.store.ts`).

---

## 1. Color

Every color is an **OKLCH channel triplet** stored in a bare custom property and wrapped by Tailwind
as `oklch(var(--token) / <alpha-value>)`. Light values live in `:root`, dark values in `.dark`
(`src/style.css:11-96`). `border` and `input` carry their own alpha instead.

| Token | Light (`:root`) | Dark (`.dark`) | Tailwind usage |
| --- | --- | --- | --- |
| `--background` | `1 0 0` | `0.145 0.004 285` | `bg-background` |
| `--foreground` | `0.205 0 0` | `0.985 0 0` | `text-foreground` |
| `--card` | `1 0 0` | `0.185 0.005 285` | `bg-card` |
| `--card-foreground` | `0.205 0 0` | `0.985 0 0` | `text-card-foreground` |
| `--popover` | `1 0 0` | `0.165 0.005 285` | `bg-popover` |
| `--popover-foreground` | `0.205 0 0` | `0.985 0 0` | `text-popover-foreground` |
| `--primary` | `0.55 0.22 285` | `0.66 0.185 285` | `bg-primary`, `text-primary` |
| `--primary-foreground` | `0.985 0 0` | `0.985 0 0` | `text-primary-foreground` |
| `--primary-strong` | `0.5 0.21 285` | `0.52 0.2 285` | `bg-primary-strong` (solid surfaces carrying white text) |
| `--primary-strong-foreground` | `1 0 0` | `1 0 0` | `text-primary-strong-foreground` |
| `--secondary` | `0.97 0 0` | `0.245 0.006 285` | `bg-secondary` |
| `--secondary-foreground` | `0.205 0 0` | `0.985 0 0` | `text-secondary-foreground` |
| `--muted` | `0.97 0 0` | `0.245 0.006 285` | `bg-muted` |
| `--muted-foreground` | `0.55 0.015 285` | `0.7 0.012 285` | `text-muted-foreground` |
| `--accent` | `0.96 0.02 285` | `0.28 0.02 285` | `bg-accent` |
| `--accent-foreground` | `0.205 0 0` | `0.985 0 0` | `text-accent-foreground` |
| `--destructive` | `0.58 0.23 25` | `0.65 0.2 25` | `bg-destructive` |
| `--destructive-foreground` | `0.985 0 0` | `0.985 0 0` | `text-destructive-foreground` |
| `--border` | `oklch(0.92 0 0)` | `oklch(1 0 0 / 8%)` | `border-border` |
| `--input` | `oklch(0.92 0 0)` | `oklch(1 0 0 / 12%)` | `border-input` |
| `--ring` | `0.55 0.22 285` | `0.62 0.19 285` | `ring-ring` |
| `--sidebar` | `0.985 0 0` | `0.165 0.005 285` | `bg-sidebar` |
| `--sidebar-foreground` | `0.205 0 0` | `0.985 0 0` | `text-sidebar-foreground` |
| `--sidebar-primary` | `0.55 0.22 285` | `0.62 0.19 285` | `bg-sidebar-primary` |
| `--sidebar-primary-foreground` | `0.985 0 0` | `0.985 0 0` | `text-sidebar-primary-foreground` |
| `--sidebar-accent` | `0.96 0.02 285` | `0.28 0.02 285` | `bg-sidebar-accent` |
| `--sidebar-accent-foreground` | `0.205 0 0` | `0.985 0 0` | `text-sidebar-accent-foreground` |
| `--sidebar-border` | `oklch(0.92 0 0)` | `oklch(1 0 0 / 8%)` | `border-sidebar-border` |
| `--sidebar-ring` | `0.55 0.22 285` | `0.62 0.19 285` | `ring-sidebar-ring` |

Legacy back-compat (`BottomMenu`, `AppFooter`): `--color-primary` = `oklch(0.55 0.22 285)` /
`oklch(0.62 0.19 285)`; `--color-dark` = `oklch(1 0 0)` / `oklch(0.145 0.004 285)`
(`src/style.css:51-53, 91-93`).

Legacy `dark-*` scale in `tailwind.config.js:56-66` is remapped onto the tokens above so old
`bg-dark` / `via-dark/40` classes keep working:
`dark` (DEFAULT) = `--background`, `50` = `--accent`, `100` = `--card`, `200` = `--popover`,
`300` = `--background`, `400` = `oklch(0.12 0.004 285)`, `500` = `oklch(0.10 0.004 285)`,
`600` = `oklch(0.08 0.004 285)`.

The brand is **violet at hue 285**. There is no other accent hue in the system.

## 2. Typography

- Family: `sans` and `poppins` both resolve to `['Inter', 'system-ui', 'sans-serif']`
  (`tailwind.config.js:79-82`). `poppins` is a legacy alias kept so old headings do not need editing.
- Inter is loaded with a `<link>` in `index.html`, deliberately not `@import`, to avoid a
  bundle-CSS → Google-CSS → woff2 waterfall (`src/style.css:1-2`).
- **No `fontSize` extension exists.** All sizes are Tailwind defaults (`text-xs` 12px / `sm` 14px /
  `base` 16px / `lg` 18px / `xl` 20px / `2xl` 24px / `3xl` 30px). Sizes in use across the app:
  `text-xs` (badges, kbd), `text-sm` (card titles, body copy), `text-[15px]` (wordmark),
  `text-base` (buttons `lg`), plus `text-2xl`/`text-3xl`/`text-4xl`/`text-5xl` in heroes.
- Weights: `font-medium` (buttons, card titles), `font-semibold` (wordmark, badges, headings),
  `font-bold` (hero titles, the `V` glyph).
- Base body: `bg-background text-foreground font-sans antialiased` (`src/style.css:113-115`).
- `p { text-wrap: pretty }` to avoid orphan words (`src/style.css:117-120`).
- Tracking: `tracking-tight` on the wordmark, `tracking-wide` on small caps labels.

## 3. Spacing

**No `spacing` extension exists** (`tailwind.config.js`), so the app uses Tailwind's default scale:
`0.5`=2px, `1`=4px, `1.5`=6px, `2`=8px, `3`=12px, `4`=16px, `5`=20px, `6`=24px, `8`=32px,
`10`=40px, `12`=48px, `16`=64px.

Recipes in use:

| Recipe | Source |
| --- | --- |
| Section rhythm between page blocks | `space-y-12` — `HomeView.vue:63`, `MoviesView.vue:70`, `SeriesView.vue:53` |
| Rail internal padding | `pb-8 pt-6` — `HorizontalScroll.vue:55` |
| Rail header spacing | `mb-4` — `HorizontalScroll.vue:4` |
| Card grid gap | `gap-6` (6-column recipe) / `gap-4` (4-column recipe) / `gap-3 md:gap-4` (bento) |
| Gutter | `px-4 md:px-12` — every view |
| Detail block spacing | `space-y-10`, `space-y-8`, `mt-12 md:mt-16` — `MovieDetailView.vue:74,120,146` |

## 4. Radius

Base `--radius: 0.75rem` (12px), defined once in `:root` and **not** redefined in `.dark`
(`src/style.css:36`). Tailwind derives the scale (`tailwind.config.js:73-78`):

| Class | Value | Resolves to |
| --- | --- | --- |
| `rounded-sm` | `calc(var(--radius) - 4px)` | 8px |
| `rounded-md` | `calc(var(--radius) - 2px)` | 10px |
| `rounded-lg` | `var(--radius)` | 12px |
| `rounded-xl` | `calc(var(--radius) + 4px)` | 16px |
| `rounded-full` | Tailwind default | 9999px |

Usage: `rounded-md` on buttons, inputs, badges; `rounded-lg` on posters; `rounded-xl` on cards,
menu rows, the top-bar pieces; `rounded-2xl` on the floating top-bar shell; `rounded-full` on
arrows and the mobile pill.

## 5. Shadows

No `boxShadow` extension exists. The only shadows in the app are arbitrary values on the top bar
(`src/modules/ui/components/AppTopBar.vue:16`):
open `shadow-[0_10px_34px_-16px_rgb(0_0_0/0.85)]`, closed `shadow-[0_10px_30px_-20px_rgb(0_0_0/0.8)]`.
`BaseCard` uses Tailwind's `shadow-sm` (`BaseCard.vue:19`).

## 6. Motion

Tokens in `src/style.css:38-43`:

| Token | Value |
| --- | --- |
| `--dur-fast` | `140ms` |
| `--dur-base` | `200ms` |
| `--dur-slow` | `280ms` |
| `--ease-out-quint` | `cubic-bezier(0.22, 1, 0.36, 1)` |
| `--ease-soft` | `cubic-bezier(0.4, 0, 0.2, 1)` |
| `--lift` | `-2px` |

Classes (`src/style.css:203-231`): `.motion-card` (lift on hover, reset on active),
`.motion-media` + `.motion-lift` (image scales to 1.03 inside its frame), `.motion-press`
(1px lift on hover, `0.985` scale on active).

Reduced motion is honoured twice: the `prefers-reduced-motion` media query and the app's own
`html.reduce-motion` class, both collapsing durations to `0.01ms` and disabling transforms
(`src/style.css:321-369`).

## 7. Container and layout contract

One recipe, defined once in `src/style.css:175-190`. No view declares its own.

| Primitive | Value | Source |
| --- | --- | --- |
| `.container-app` | `width: 100%; max-width: var(--container-max); margin-inline: auto; padding-inline: var(--gutter)` | `src/style.css` |
| `--container-max` | `90rem` (1440px) | `src/style.css` |
| `--gutter` | `1rem` (16px), `3rem` (48px) from `768px` | `src/style.css` |
| `.grid-posters` | `repeat(auto-fill, minmax(var(--poster-min), 1fr))` with `--grid-gap` | `src/style.css` |
| `--poster-min` | `8.5rem` (136px), `10.5rem` (168px) from `768px` | `src/style.css` |
| `--grid-gap` | `1.125rem` (18px), `1.5rem` (24px) from `768px` | `src/style.css` |
| `.rail` | flex scroller that cancels the gutter (`margin-inline: calc(var(--gutter) * -1)`) and pads it back, `scroll-snap-type: x proximity`, `scroll-padding-inline: var(--gutter)` so snap cannot eat the leading gutter, hidden scrollbar | `src/style.css` |
| `--hero-sm/md/lg` | `20rem` / `24rem` / `30rem` (320/384/480px) | `src/style.css` |
| `--mosaic-lead-min` | `24rem`: floor for the mosaic lead tile | `src/style.css` |
| `--bar-height`, `--bar-offset`, `--chrome-top` | `3rem`, `0.75rem`, `4rem` | `src/style.css` |

`.container-custom` was removed: it nested a second gutter inside the views and was the source of
the double gutter in Search, Favorites and History. `BaseContainer` renders `.container-app`, and
`BaseStack` provides the Astryx spacing steps.

Hero heights are a floor, not a lock: the hero sections use `min-h-[var(--hero-*)]` with a
flowing content column so a long title can never be clipped by the hero's own `overflow: hidden`
(measured: a fixed 384px hero cut its CTA row by 28.5px).

### 7.1 The mosaic

`MosaicHighlights.vue` is the only mosaic in the app. `/`, `/movies` and `/series` open with it,
so a change to the recipe belongs in the component, never in a view.

| Piece | Recipe |
| --- | --- |
| Grid | `grid-cols-2`, `md:grid-cols-6`, `auto-rows-[minmax(0,auto)]`, `gap: var(--grid-gap)` |
| Lead | `col-span-2 md:col-span-4 md:row-span-2`, `aspect-[4/5]` then `sm:aspect-[16/10]`, `md:aspect-auto md:min-h-[var(--mosaic-lead-min)]` |
| Tall tiles | `col-span-1 md:row-span-2`, `aspect-[2/3]`, `md:aspect-auto md:h-full` |
| Row header | `col-span-2 md:col-span-6`, the band title on the container's leading edge and its action on the trailing edge, no box and no padding |
| Wide tiles | `col-span-2 md:col-span-2`, `aspect-[16/10]`, three of them: art, scrim, title and score, the same family as the tall tiles with less weight |

Row tracks are content-sized on purpose. With a fixed `grid-auto-rows` the tiles overflowed their
rows and later siblings painted over earlier ones (measured at 390px: 23,874 px² per tile pair).
The mosaic takes `lead`, an optional `loading` flag (skeleton until the view knows whether there is
data, then nothing rather than an eternal skeleton), and an optional `lead-actions` slot for extra
actions the view wants on the lead (the movies "Mi Lista"). The tiles' badge is the only place a
collection label appears: there is no tracked-caps kicker above the lead title, which the impeccable
detector flags as `hero-eyebrow-chip` and which duplicated the badge.

## 8. Component rules

Primitives live in `src/modules/ui/components/base/` and are re-exported by `base/index.ts`.

**BaseButton** (`BaseButton.vue`) — polymorphic `router-link` / `a` / `button`. Base:
`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium`.
Sizes: `sm` `h-8 px-3 text-xs`, `default` `h-9 px-4 py-2`, `lg` `h-11 px-8 text-base`,
`icon` `h-9 w-9`. Variants: `default | secondary | outline | ghost | destructive | link`.

**BaseBadge** (`BaseBadge.vue`) — `inline-flex items-center gap-1 rounded-md border px-2 py-0.5
text-xs font-semibold`. Variants: `default` (`bg-primary-strong text-primary-strong-foreground`),
`secondary`, `outline`, `muted`.

**BaseCard** (`BaseCard.vue`) — `rounded-xl border border-border bg-card text-card-foreground
shadow-sm`; `interactive` adds `motion-card transition-colors hover:bg-accent hover:border-primary/40
cursor-pointer`.

**BaseInput** (`BaseInput.vue`) — `h-9 rounded-md border border-input bg-transparent`, optional
`leadingIcon` / `trailingIcon` padding, exposes `focus()`.

**BaseSelect** (`BaseSelect.vue`) — native `select` with a chevron overlay,
`h-9 appearance-none rounded-md border border-input`, `relative inline-flex`.

**Media cards** — `MovieCard.vue` and `TVShowCard.vue` are structurally identical: poster
`figure.relative aspect-poster rounded-lg overflow-hidden bg-muted ring-1 ring-border`, hover
`-translate-y-0.5 shadow-lg ring-primary/40`, title block `mt-3 px-0.5` with
`h3 text-sm font-medium truncate`. Width is set by the presenting view, not by the card
(`flex-none w-[160px] md:w-[220px]` in the rails).

**Ambilight hover** — each card carries one `.ambilight` layer (`src/style.css`): the card's own
poster as a blurred background behind the frame, `inset: -8% -7% 27% -7%`, `blur(20px)
saturate(1.3)`, `opacity 0 → .55` and `scale(.94) → 1` on `:hover`/`:focus-within`. Three rules keep
it cheap and they are the contract, not an optimisation left to taste:

1. **No extra request.** The layer reuses the poster URL the card already loads; the browser serves
   it from cache (measured: 12 image requests before hovering, 12 after).
2. **Lazy priming.** `background-image` is bound only once the card receives `mouseenter` or
   `focusin`, so a grid or rail of 40+ cards fetches nothing extra and paints nothing at rest
   (measured: 0 of 74 layers primed after load, 1 after one hover).
3. **Compositor only.** The animation touches `opacity` and `transform` and nothing else, and
   `will-change` exists only while hovered. Measured on hover: **0 layouts, 1 style recalculation**,
   both card enter and leave.

The parent card is `isolate` so `z-index: -1` keeps the glow behind its own poster instead of the
page background, and `pointer-events: none` keeps it out of the hit test.

**Aspect ratios** (`src/style.css:225-231`): `.aspect-poster` = `2 / 3`, `.aspect-backdrop` = `16 / 9`.

## 9. What is missing

The sources define no font-size extension (the `--text-*` variables are documentation and the
`.type-*` classes; the Tailwind utilities keep their own values), no shadow tokens, no z-index
scale (values are inline: top bar `z-[65]`, sidebar `z-[70]`), and no breakpoint contract beyond
Tailwind's defaults. Container, grid and hero recipes are no longer in this list: they are now
single tokens (section 7).

Known gaps that are tracked but not fixed here: the eyebrow-badge-above-heading pattern was
removed from all eight views; `SettingsView` section headings were raised above body size;
empty states now carry an `h1`; the hero scrims use `.scrim-b`/`.scrim-r`, which are dark in both
themes instead of inheriting `--background` (in light theme that washed the hero art to white).
