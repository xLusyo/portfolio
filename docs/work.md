# Work gallery: Markdown-first content

All project entries appear on the homepage, newest first. Images and titles open accessible native dialogs; there are no standalone gallery or case-study pages.

## Add or update a project

1. Put the real screenshot in `src/assets/` so Astro can optimize it.
2. Create a Markdown file under `src/content/work/`; nested folders are supported.
3. Supply frontmatter:

```yaml
---
title: Project Name
publishDate: 2026-01-15 00:00:00
img: ../../assets/project-thumb.webp
img_alt: Project Name homepage showing its services and navigation
tags:
  - WordPress
  - Custom Theme
# url: https://verified-public-destination.example
---
```

Image paths are relative to each Markdown file; nested entries need another `../`. The collection validates image metadata. Cards show the screenshot, title, badges, and an optional verified website link. Keep entries frontmatter-only; descriptions and case-study bodies are not displayed. Do not invent public project destinations.

`src/data/portfolio.ts` exports `getPortfolioProjects()`, the central selection and ordering entry point. All existing projects are included so retiring `/work/` loses no content.

## Links and redirects

`/#project=portal-df` opens a project directly. Encode nested IDs, for example `/#project=nested%2Fduvet-genius`. Keep entry filenames stable because they determine project IDs.

`/work/` redirects to `/#projects`. Existing `/work/<id>` URLs redirect directly to the corresponding homepage dialog. `/about/` redirects to `/#about`. Astro’s static build emits HTML redirect pages; HTTP redirect status codes require host-level configuration.

Without JavaScript, image and title links open the optimized full screenshot. Optional website links remain separate from preview triggers and open in a new tab with `noopener noreferrer`.

## Images and dialogs

Responsive thumbnails are top-cropped 16:10 WebP images. Full screenshots keep their original proportions and load on demand from inert templates. Dialogs support keyboard focus containment, Escape, Close, backdrop dismissal, focus restoration, background scroll locking, and loading/error feedback. A sticky Close toolbar stays reachable for tall images.

Run `npm run build` and `npm run test:e2e` after changes. Image, gallery, deep-link, redirect, and failure tests cover the single-page gallery.
