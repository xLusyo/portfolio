# Portfolio styling guide

## Direction

A clean developer portfolio built with Astro and native CSS. Preserve route slugs, navigation labels, project content, and the Christian wordmark. Use real project imagery, open layouts, and restrained motion rather than decorative gradient backgrounds.

## Brand palette

These primitives are defined in `src/styles/global.css` and never change between themes:

| Token | Hex | Role |
| --- | --- | --- |
| `--emerald` | `#5bba6f` | Dark-theme links and buttons; gradient highlight |
| `--medium-jungle` | `#3fa34d` | Gradient transition |
| `--forest-green` | `#2a9134` | Gradient midpoint and decoration |
| `--turf-green` | `#137547` | Light-theme links and buttons |
| `--deep-forest` | `#054a29` | Deep brand accents and gradient endpoint |

The complete five-color gradient is `--gradient-accent`. Use it sparingly, such as the portrait frame, not behind body text. Emerald is not suitable for white body-sized button labels. Button pairs are turf/white in light mode (5.73:1) and emerald/near-black in dark mode (7.35:1).

## Semantic colors and themes

The `.theme-dark` class on `<html>` swaps semantic colors. Respect saved preferences and the initial system preference.

- `--gray-999`: page background, off-white in light mode and deep green-black in dark mode.
- `--surface`: raised surfaces.
- `--gray-0` / `--gray-100`: strongest text and headings.
- `--gray-200`: body text.
- `--gray-300` / `--gray-400`: secondary text.
- `--border` / `--gray-800`: subtle rules.
- `--accent-regular` and `--accent-text-over`: paired button background and text.
- `--link-color`: accessible theme-aware links.

Neutral colors have a consistent green undertone. Do not reintroduce purple raster backgrounds. `--gradient-accent-orange` remains a green-only compatibility alias, not a second brand palette.

## Typography

Public Sans for body text; Rubik for headings and branding, with system sans-serif fallbacks. Use the `--text-*` scale. Large headings use responsive `clamp()` sizing, medium weight, and restrained negative tracking. Keep body copy at a comfortable line height and roughly 65 characters or less per line.

## Layout and shape

- Mobile first; primary desktop breakpoint: `50em`.
- `.wrapper`: maximum width 78rem, horizontal padding 1.5rem.
- Section spacing: typically 4–7rem, responsive to viewport width.
- Home: asymmetric portrait hero, open skills rows, staggered project grid, static tool grid.
- Project images have separate captions, not overlaid titles. Cards use open spacing with a name and compact outlined badges, without descriptions. Image/name links open the shared native lightbox; optional website links stay separate. See `docs/work.md`.
- Content surfaces: `--radius` (12px); controls: 8px. The compact theme switch and project tag pills retain their semantic pill shape.
- Project lightboxes use responsive 1–2.5rem outer content padding, aligned headings and media, and an inset screenshot frame with 0.5–1rem padding. Card captions also have horizontal breathing room.
- Use borders and whitespace before shadows. Shadows are green-tinted and subtle.

## Interaction and accessibility

- Use semantic links and buttons with visible `:focus-visible` rings.
- Desktop navigation stays on one line; mobile menu supports Escape and `aria-controls`.
- The skip link targets the page content wrapper.
- Preserve alt text and lazy-load below-the-fold project images.
- Motion only supports entrances or interaction feedback. Respect `prefers-reduced-motion` globally and in components.
- The tool collection is stationary and readable rather than endlessly scrolling.
- Test both themes, keyboard navigation, narrow screens, and forced colors.

## Homepage motion

- GSAP core and ScrollTrigger are loaded only by the homepage's processed Astro script. `src/scripts/home-motion.ts` owns animation lifecycle; shared component hooks do not load GSAP on other routes.
- `main[data-home-motion]` scopes `[data-motion="hero"]`, `[data-motion="portrait"]`, and `[data-motion="reveal"]` hooks. Keep these on outer wrappers, not the project images whose hover transforms belong to CSS.
- Hero copy enters with 16px vertical travel, 0.55-second `power2.out` tweens, and 0.08-second stagger. The portrait enters alongside it in 0.65 seconds on desktop, or on scroll when below the fold.
- Skills rows, project wrappers, the tool section, and contact contents reveal independently once at `clamp(top 88%)`, with 16px travel and 0.55-second duration. Scrolling remains native; there is no pinning, scrubbing, parallax, or looping motion.
- Static HTML/CSS is always visible. GSAP adds temporary opacity/transform values only after loading and clears them on completion. Do not add CSS rules that pre-hide motion hooks.
- Reduced-motion and forced-colors preferences disable GSAP entrances. Preference changes revert existing animations; keyboard focus immediately finishes the containing entrance. Opacity rather than visibility is intentional so unrevealed links remain keyboard-reachable.
- Page exit reverts scoped animations and listeners. Back/forward-restored pages stay static instead of replaying entrances. Fonts settling triggers a measurement refresh; no custom scroll listeners are needed.
- Test motion-enabled behavior as well as the default reduced-motion geometry suite in `tests/motion.spec.ts`.

## Implementation

Global tokens/reset/utilities belong in `src/styles/global.css`. Component styles are scoped in Astro `<style>` blocks. Avoid new styling frameworks. `npm run build` generates the static routes; do not edit `dist/` directly.
