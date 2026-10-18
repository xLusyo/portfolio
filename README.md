# Christian Baloncio’s portfolio

A single-page personal portfolio built with Astro, strict TypeScript, native CSS, and optimized local images. The approved source is `docs/Redesign/Portfolio_Mockup_Export.zip`; the final site fills the viewport edge to edge and omits all mockup presentation controls and the light outer canvas.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:4321. To inspect the generated static site:

```sh
npm run build
npm run preview
```

## Update content

`src/data/portfolio.ts` contains the profile, summary, contact links, experience, tools, résumé configuration, and project ordering entry point. Projects remain Markdown-first in `src/content/work/`, with original images in `src/assets/`; see `docs/work.md`.

Work Experience contains the supplied roles, dates, employment types, and achievements in `experience`. No résumé PDF has been supplied, so the download remains labeled Sample. Put a supplied PDF in `public/` and set `resume.pdf` to its root-relative URL, for example `/resume.pdf`.

The contact form opens an email draft. It does not send messages or use a backend. Website links are omitted until a real URL is supplied.

## Pages and redirects

The homepage is the only portfolio content page. `/about/` redirects to `/#about`, `/work/` redirects to `/#projects`, and existing `/work/<project-id>` URLs redirect to homepage project dialogs, including nested IDs. A minimal 404 page links home.

Astro emits HTML redirects for static hosting. HTTP 301 responses require host-level redirect configuration; no hosting configuration or deployment is added here.

## Verification

```sh
npm run build
npm run test:e2e
```

Install Chromium once if needed with `npx playwright install chromium`. Tests cover responsive scrolling, anchors, images, dialogs, contact drafts, sample downloads, redirects, reduced motion, and forced colors. See `docs/testing.md`.

With the development server running, `node scripts/inspect-portfolio.mjs` saves desktop and mobile screenshots under `artifacts/portfolio/`. Browser tests also save captures under `test-results/`. These generated artifacts are ignored by Git.
