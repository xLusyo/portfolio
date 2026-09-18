# Work gallery: Markdown-first content

The homepage's Selected Work and `/work/` share `PortfolioPreview.astro` and `ProjectLightbox.astro`. Clicking an image or project name opens an accessible native lightbox rather than a case-study page. Keep this model for future projects.

## Add or update a project

1. Put the real project screenshot in `src/assets/` so Astro can optimize it.
2. Create a `.md` file under `src/content/work/` (nested folders work).
3. Add frontmatter following this example:

```yaml
---
title: Project Name
publishDate: 2026-01-15 00:00:00
img: ../../assets/project-thumb.webp
img_alt: Project Name homepage showing its services and navigation
tags:
  - WordPress
  - Custom Theme
# Optional: use only a verified public destination.
# url: https://your-project-domain.com
---
```

The `img` value is relative to the Markdown file. For a file in `src/content/work/nested/`, use `../../../assets/project-thumb.webp`. Astro's `image()` schema validates the source and supplies its dimensions. Cards use responsive, top-cropped 16:10 WebP thumbnails; lightboxes and no-JavaScript links use optimized full screenshots. Keep originals in `src/assets/`, not `public/`, to ensure they enter the image pipeline.

No Markdown body or description is needed. The presentation intentionally contains only the screenshot, project name, technology badges, and optional website link. The schema still accepts legacy `description` values but does not display them. Do not reintroduce case-study paragraphs into cards or lightboxes.

`url` must be an absolute HTTP(S) URL. When omitted, no website link is rendered. Do not guess URLs or link private client portals. Existing entries have no verified URL supplied, so their links remain omitted. Website links are separate from preview triggers and open in a new tab with `noopener noreferrer`.

## Ordering and URLs

- Projects sort newest first by `publishDate`.
- The homepage shows the two newest entries; `/work/` shows all entries.
- The Markdown path determines the project ID. Preserve existing filenames unless you also plan a URL migration.
- `/work/#project=portal-df` opens a project directly.
- Nested IDs are encoded, for example `/work/#project=nested%2Fduvet-genius`.
- Old `/work/<id>` routes generate Astro static redirects to the matching gallery lightbox. Static hosting uses a meta refresh; configure server-level 301s separately if required by your host.
- Without JavaScript, image and title links still open the screenshot directly. The gallery's names, badges, and website links remain usable.

## Interaction and styling

The shared dialog supports Escape, Close, outside-click dismissal, modal focus containment, focus restoration, and background scroll locking. A sticky Close toolbar stays reachable for tall screenshots. Preview images load on demand from inert templates with loading/error feedback. The same green brand tokens, Public Sans/Rubik typography, rounded screenshot frames, and compact outlined badges work in both themes. No extra frontend dependency is required.

## Verification

Run `npm run build` and `npm run test:e2e`. `tests/work.spec.ts` covers gallery previews on both routes, mobile/desktop and light/dark layouts, dismissal and keyboard behavior, deep links, redirects, and image failure handling.
