# AGENTS.MD - AI Agent Guidelines for Portfolio Project

This document provides essential context and guidelines for AI agents working on Christian Baloncio's portfolio website.

## Project Overview

This is a **personal portfolio website** for Christian Baloncio, a Full Stack Web Developer based in the Philippines. The site showcases his work experience, skills, and projects.

### Tech Stack

- **Framework**: [Astro](https://astro.build/) v5.15.4
- **Language**: TypeScript (strict mode)
- **Styling**: CSS with CSS Custom Properties (no Tailwind/Sass)
- **Content**: Astro Content Collections with Markdown
- **Build**: Static Site Generation (SSG)

## Project Structure

```
portfolio/
├── src/
│   ├── components/     # Reusable Astro components
│   ├── content/        # Markdown content for portfolio items
│   │   └── work/       # Project case studies
│   ├── layouts/        # Page layouts (BaseLayout)
│   ├── pages/          # Route pages
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── work.astro
│   │   ├── work/[...slug].astro
│   │   └── 404.astro
│   ├── styles/         # Global CSS
│   │   └── global.css
│   └── content.config.ts
├── public/
│   ├── assets/         # Static images and backgrounds
│   └── favicon.svg
├── docs/
│   └── styling.md      # Styling guidelines
└── package.json
```

## Key Components

### Layout Components
- **BaseLayout.astro**: Main page wrapper with head, nav, footer, and background styling
- **MainHead.astro**: Document head with meta, fonts, and theme script

### UI Components
- **Nav.astro**: Main navigation with mobile menu and social links
- **Footer.astro**: Site footer with copyright and links
- **Hero.astro**: Page hero section with title and tagline
- **Skills.astro**: Three-column skills showcase
- **TechStack.astro**: Technology marquee display
- **TechStackMarquee.astro**: Animated scrolling tech icons
- **ContactCTA.astro**: Call-to-action section for contact

### Reusable Elements
- **Icon.astro**: SVG icon component with gradient support
- **TechIcon.astro**: Technology-specific icon component
- **Pill.astro**: Tag/badge component
- **CallToAction.astro**: Button/link component
- **Grid.astro**: Layout grid with offset and small variants
- **PortfolioPreview.astro**: Project card preview
- **ThemeToggle.astro**: Dark/light mode toggle

## Styling Guidelines

See `docs/styling.md` for comprehensive styling documentation.
Use skills in `agents/skills` for branding guidelines.

### Quick Reference

#### CSS Custom Properties (Variables)
The project uses CSS custom properties defined in `src/styles/global.css`. Key variable groups:

- **Colors**: `--gray-0` through `--gray-999`, `--accent-light/regular/dark`
- **Text Sizes**: `--text-sm` through `--text-5xl`
- **Fonts**: `--font-body` (Public Sans), `--font-brand` (Rubik)
- **Shadows**: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- **Gradients**: `--gradient-subtle`, `--gradient-accent`, `--gradient-accent-orange`
- **Transitions**: `--theme-transition` (0.2s ease-in-out)

#### Theme Support
The site supports light and dark themes via the `.theme-dark` class on `<html>`. Variables automatically adjust for dark mode.

#### Responsive Design
- Mobile-first approach
- Breakpoint: `50em` (800px) for desktop layouts
- Use media query: `@media (min-width: 50em)`

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at localhost:4321
npm run build        # Build for production to ./dist/
npm run preview      # Preview production build
```

## Content Management

### Adding New Projects

1. Create a new `.md` file in `src/content/work/`
2. Include required frontmatter:
```yaml
---
title: Project Name
publishDate: YYYY-MM-DD 00:00:00
img: /assets/project-thumb.png
img_alt: Alt text description
# Optional verified public project link:
# url: https://your-project-domain.com
tags:
  - Dev
  - WordPress
---
```
3. Add project thumbnail to `public/assets/`
4. Keep entries frontmatter-only. Cards and lightboxes show the image, name, badges, and optional website link, not descriptions or case-study bodies. See `docs/work.md` for the ongoing content workflow and legacy URL behavior.

### Content Schema
Defined in `src/content.config.ts`:
- `title`: string (required)
- `description`: string (optional legacy metadata; not displayed)
- `url`: absolute HTTP(S) URL (optional public project link)
- `publishDate`: date (required)
- `tags`: string[] (required)
- `img`: string (required)
- `img_alt`: string (optional)

## Icons

Icons are managed in `src/components/IconPaths.ts`. The project uses:
- **Phosphor Icons** for UI icons
- **Simple Icons** / custom SVG paths for tech logos

### Adding New Icons

1. Open `src/components/IconPaths.ts`
2. Add SVG path data to the `iconPaths` object
3. Use via `<Icon icon="icon-name" />` or `<TechIcon icon="icon-name" />`

## Best Practices

### Component Development
- Use Astro's component syntax with frontmatter for logic
- Scope styles using `<style>` tags in components
- Use `:global()` selector sparingly for child element styling
- Prefer CSS custom properties over hardcoded values

### Accessibility
- Use semantic HTML elements
- Include `aria-*` attributes for interactive elements
- Provide `.sr-only` text for icon-only buttons
- Support `prefers-reduced-motion` and `forced-colors`

### Performance
- Lazy load images below the fold with `loading="lazy"`
- Use `decoding="async"` for images
- Background images load progressively with `.loaded` class
- Minimize external dependencies

### Code Style
- Follow Astro's recommended TypeScript strict mode
- Use interface Props for component props
- Organize imports: Astro components, then utilities
- Comment complex logic and provide docstrings

## Contact Information

- **Developer**: Christian Baloncio
- **Email**: work.christianbaloncio@gmail.com
- **GitHub**: https://github.com/xLusyo
- **LinkedIn**: https://www.linkedin.com/in/christian-baloncio-aa0465395

## Files to Never Modify Directly

- `node_modules/` - Managed by npm
- `dist/` - Generated build output
- `.astro/` - Astro generated types
- `package-lock.json` - Only modify via npm commands
