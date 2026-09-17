# Browser regression tests

## Setup and commands

```sh
npm install
npx playwright install chromium
npm run test:e2e
```

Playwright reuses the local Astro server at `http://localhost:4321` when one is running, or starts and stops its own server. In CI it always starts its own server. Use `npm run test:e2e:ui` for interactive debugging.

## Coverage

The Chromium suite in `tests/homepage.spec.ts` checks six widths (320, 390, 768, 800, 1024, 1440px) in both light and dark themes:

- No horizontal page overflow.
- A bounded portrait with a consistent 4:5 crop, including tablet widths.
- All 18 technology SVGs sized to 24px and contained in their label rows.
- Compact desktop navigation and a hero that fits the tested desktop viewport.
- Successfully loaded portrait and lazy-loaded project images.
- No uncaught page errors.

Additional tests exercise mobile menu opening, Escape/focus restoration, responsive resizing, navigation, and theme persistence. `tests/work.spec.ts` covers project lightboxes on the homepage and `/work/` at 320, 800, and 1440px in both themes, image loading/failure, keyboard and backdrop dismissal, focus restoration, scroll locking, nested deep links, legacy redirects, and no-JavaScript image links.

## Results

Each successful layout test captures a full-page screenshot under `test-results/`. Failures include a screenshot and trace. View the HTML report using `npx playwright show-report`.

Screenshots are inspection artifacts, not pixel-diff baselines. Geometry assertions provide the automated layout regression checks. Reports and captures are gitignored. External web fonts can affect timing and typography, so screenshot comparisons should use the same browser/platform and font availability.

The original regression checks were verified to fail before the fixes: technology SVGs retained a 127px intrinsic height in 24px slots, and the tablet portrait became a landscape crop because width expansion conflicted with a fixed maximum height.
