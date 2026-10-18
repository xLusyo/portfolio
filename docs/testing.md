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
- Ultrawide checks at 1920×1080, 2560×1440, and 3840×2160 verify the centered 1920px width cap, full-height scrolling, and desktop portrait height cap of 480px.
- Stationary desktop profile, independently scrolling right column, and a single mobile scroll container.
- Sticky active section navigation, native anchors, breakpoint resizing, and final-content clearance above the mobile contact action.
- No horizontal overflow, responsive project grids, optimized portrait/project images, lazy thumbnail loading, and deferred full screenshots.
- Project dialogs: keyboard entry, focus containment, Escape, Close, backdrop dismissal, restored focus, scroll locking, image failure, and no-JavaScript image links.
- Contact dialogs: validation, keyboard behavior, encoded email-draft recipient/subject/body, and accurate draft-only feedback. Tests observe the mailto navigation; they do not send email or test an installed mail client.
- Sample résumé download filename and file contents.
- Old About, Work, and nested project URL redirects; malformed project links; useful 404 navigation.
- Consistent approved colors under both system color schemes, reduced motion, forced colors, and absence of mockup presentation controls.
- GSAP motion: real intermediate animation frames, cleared styles, once-only reveals, both scroll roots, breakpoint changes, focus during pending entrances, direct links, history restoration, preference changes, lazy loading, and module-load failure. Tests exercise motion-enabled behavior at mobile, tablet, desktop, and 4K sizes; other geometry checks retain reduced motion for stable measurement.

## Screenshots

Successful geometry tests capture the homepage and bottom content under `test-results/`. Dialog tests also capture screenshots. Motion-enabled tests save settled tools-section captures at 390px, 1024px, 1440px, and 3840px widths. Failures retain a screenshot and trace; use `npx playwright show-report` to inspect them.

Run `node scripts/inspect-portfolio.mjs` with the local server running to save homepage, tools, and project-dialog screenshots at the requested desktop/mobile sizes plus 1920×1080, 2560×1440, and 3840×2160 under `artifacts/portfolio/`.

Captures are inspection artifacts rather than pixel-diff baselines. Local fonts make typography independent of network access. Chromium emulation does not substitute for physical iOS/Android testing, and external email delivery is outside this static site’s functionality.

## Latest verification

The production build, TypeScript check (`node_modules/.bin/tsc --noEmit`), and all 60 Chromium browser tests passed on 2026-10-18. Desktop, tablet, mobile, 2K, and 4K screenshots were captured and visually inspected; the 1920px width cap and 480px desktop portrait cap were verified. Generated static redirect targets and the sample résumé output were also inspected. GSAP motion was verified with real intermediate frames, responsive scroll roots, cleared styles, reduced-motion and forced-colors preferences, keyboard interaction, deep links, history restoration, no JavaScript, and a simulated module-load failure.
