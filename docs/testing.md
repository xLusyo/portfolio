# Browser regression tests

## Commands

```sh
npm install
npx playwright install chromium
npm run build
npm run test:e2e
```

Playwright uses Chromium and a local Astro server at `http://localhost:4321`. It reuses an existing development server or starts one. `npm run test:e2e:ui` opens interactive debugging. In restricted environments, Chromium may require permission to launch outside the filesystem sandbox.

## Coverage

- Requested viewports: 1440×900, 1280×800, 390×844, and 375×812. Additional checks at 320px and tablet widths of 768px and 1024px, and both sides of the 1024px layout breakpoint.
- Stationary desktop profile, independently scrolling right column, and a single mobile scroll container.
- Sticky active section navigation, native anchors, breakpoint resizing, and final-content clearance above the mobile contact action.
- No horizontal overflow, responsive project grids, optimized portrait/project images, lazy thumbnail loading, and deferred full screenshots.
- Project dialogs: keyboard entry, focus containment, Escape, Close, backdrop dismissal, restored focus, scroll locking, image failure, and no-JavaScript image links.
- Contact dialogs: validation, keyboard behavior, encoded email-draft recipient/subject/body, and accurate draft-only feedback. Tests observe the mailto navigation; they do not send email or test an installed mail client.
- Sample résumé download filename and file contents.
- Old About, Work, and nested project URL redirects; malformed project links; useful 404 navigation.
- Consistent approved colors under both system color schemes, reduced motion, forced colors, and absence of mockup presentation controls.

## Screenshots

Successful geometry tests capture the homepage and bottom content under `test-results/`. Dialog tests also capture screenshots. Failures retain a screenshot and trace; use `npx playwright show-report` to inspect them.

Run `node scripts/inspect-portfolio.mjs` with the local server running to save homepage, tools, and project-dialog screenshots at all four requested sizes under `artifacts/portfolio/`.

Captures are inspection artifacts rather than pixel-diff baselines. Local fonts make typography independent of network access. Chromium emulation does not substitute for physical iOS/Android testing, and external email delivery is outside this static site’s functionality.

## Latest verification

The production build, TypeScript check (`node_modules/.bin/tsc --noEmit`), and all 40 Chromium browser tests passed on 2026-10-18. The four requested viewport screenshots were captured and visually inspected after removing presentation controls and the outer canvas. Generated static redirect targets and the sample résumé output were also inspected.
