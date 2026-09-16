# Styling Guide - Portfolio Project

This document provides comprehensive styling guidelines for Christian Baloncio's portfolio website. Follow these conventions to maintain consistency across the codebase.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [CSS Custom Properties](#css-custom-properties)
3. [Color System](#color-system)
4. [Typography](#typography)
5. [Spacing & Layout](#spacing--layout)
6. [Shadows & Effects](#shadows--effects)
7. [Responsive Design](#responsive-design)
8. [Theme Support](#theme-support)
9. [Component Styling Patterns](#component-styling-patterns)
10. [Animation & Transitions](#animation--transitions)
11. [Accessibility](#accessibility)

---

## Architecture Overview

The project uses **vanilla CSS with CSS Custom Properties** (CSS variables). No CSS frameworks like Tailwind or preprocessors like Sass are used.

### File Structure

```
src/
├── styles/
│   └── global.css      # Global variables, resets, and utility classes
├── components/
│   └── *.astro         # Component-scoped styles in <style> tags
└── layouts/
    └── BaseLayout.astro # Layout-specific styles (backgrounds)
```

### Styling Approach

1. **Global styles** define CSS custom properties and base element styles
2. **Component styles** are scoped within Astro components using `<style>` tags
3. **Layout styles** handle page-level concerns like backgrounds
4. **Utility classes** provide common patterns (`.stack`, `.wrapper`, `.gap-*`)

---

## CSS Custom Properties

All design tokens are defined as CSS custom properties in `:root` within `src/styles/global.css`.

### Naming Convention

- **Colors**: `--gray-{0-999}`, `--accent-{light|regular|dark}`
- **Typography**: `--text-{sm|base|md|lg|xl|2xl|3xl|4xl|5xl}`, `--font-{body|brand}`
- **Effects**: `--shadow-{sm|md|lg}`, `--gradient-{name}`
- **Transitions**: `--theme-transition`

---

## Color System

### Gray Scale

The gray scale uses a **0-999 numbering system** where lower numbers are darker and higher numbers are lighter (in light mode).

```css
/* Light Mode (default) */
--gray-0: #090b11;      /* Darkest - used for primary text */
--gray-50: #141925;
--gray-100: #283044;    /* Headings */
--gray-200: #3d4663;    /* Body text */
--gray-300: #505d84;
--gray-400: #6474a2;    /* Secondary text */
--gray-500: #8490b5;
--gray-600: #a3acc8;
--gray-700: #c3cadb;
--gray-800: #e3e6ee;    /* Borders */
--gray-900: #f3f4f7;    /* Subtle backgrounds */
--gray-999: #ffffff;    /* Page background */
```

### Accent Colors

The accent palette provides the brand purple color at three intensities:

```css
--accent-light: #c561f6;    /* Lightest purple */
--accent-regular: #7611a6;  /* Primary brand color */
--accent-dark: #1c0056;     /* Darkest purple */

--accent-overlay: hsla(280, 89%, 67%, 0.33);  /* Transparent overlay */
--accent-text-over: var(--gray-999);          /* Text on accent backgrounds */
```

### Link Color

```css
--link-color: var(--accent-regular);  /* Light mode */
/* Dark mode: var(--accent-dark) */
```

### Usage Guidelines

| Purpose | Variable |
|---------|----------|
| Page background | `--gray-999` |
| Primary text | `--gray-200` |
| Headings | `--gray-100` or `--gray-0` |
| Secondary/muted text | `--gray-300` to `--gray-400` |
| Borders | `--gray-800` |
| Subtle backgrounds | `--gray-900` |
| Interactive elements | `--accent-regular` |
| Hover states | `--accent-dark` or `--accent-light` |

---

## Typography

### Font Families

```css
--font-system: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", 
               Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", 
               "Helvetica Neue", sans-serif;

--font-body: "Public Sans", var(--font-system);   /* Body text */
--font-brand: Rubik, var(--font-system);          /* Headings, branding */
```

### Font Sizes

```css
--text-sm: 0.875rem;    /* 14px - Small text, labels */
--text-base: 1rem;      /* 16px - Base body text */
--text-md: 1.125rem;    /* 18px - Slightly larger body */
--text-lg: 1.25rem;     /* 20px - Lead paragraphs */
--text-xl: 1.625rem;    /* 26px - H5, small headings */
--text-2xl: 2.125rem;   /* 34px - H4 */
--text-3xl: 2.625rem;   /* 42px - H3 */
--text-4xl: 3.5rem;     /* 56px - H2 */
--text-5xl: 4.5rem;     /* 72px - H1, hero titles */
```

### Heading Styles

```css
h1, h2, h3, h4, h5 {
  line-height: 1.1;
  font-family: var(--font-brand);
  font-weight: 600;
  color: var(--gray-100);
}

h1 { font-size: var(--text-5xl); }
h2 { font-size: var(--text-4xl); }
h3 { font-size: var(--text-3xl); }
h4 { font-size: var(--text-2xl); }
h5 { font-size: var(--text-xl); }
```

### Body Text

```css
body {
  font-family: var(--font-body);
  color: var(--gray-200);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
}
```

---

## Spacing & Layout

### Utility Classes

#### Stack (Vertical Flex)

```css
.stack {
  display: flex;
  flex-direction: column;
}
```

#### Gap Utilities

```css
.gap-2  { gap: 0.5rem; }   /* 8px */
.gap-4  { gap: 1rem; }     /* 16px */
.gap-8  { gap: 2rem; }     /* 32px */
.gap-10 { gap: 2.5rem; }   /* 40px */
.gap-15 { gap: 3.75rem; }  /* 60px */
.gap-20 { gap: 5rem; }     /* 80px */
.gap-30 { gap: 7.5rem; }   /* 120px */
.gap-48 { gap: 12rem; }    /* 192px */
```

Desktop variants use `lg:` prefix:
```css
.lg\:gap-4  { gap: 1rem; }   /* At min-width: 50em */
.lg\:gap-20 { gap: 5rem; }
/* etc. */
```

#### Wrapper (Content Container)

```css
.wrapper {
  width: 100%;
  max-width: 83rem;        /* 1328px */
  margin-inline: auto;
  padding-inline: 1.5rem;  /* 24px horizontal padding */
}
```

### Common Layout Patterns

#### Card/Box Pattern

```css
.box {
  border: 1px solid var(--gray-800);
  border-radius: 0.75rem;          /* Mobile: 12px */
  padding: 1.5rem;                 /* Mobile: 24px */
  background-color: var(--gray-999_40);
  box-shadow: var(--shadow-sm);
}

@media (min-width: 50em) {
  .box {
    border-radius: 1.5rem;         /* Desktop: 24px */
    padding: 2.5rem;               /* Desktop: 40px */
  }
}
```

#### Grid Pattern

```css
.grid {
  display: grid;
  grid-auto-rows: 1fr;
  gap: 1rem;
  list-style: none;
  padding: 0;
}

@media (min-width: 50em) {
  .grid {
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
  }
}
```

---

## Shadows & Effects

### Shadow Tokens

```css
/* Small - subtle elevation */
--shadow-sm:
  0px 6px 3px rgba(9, 11, 17, 0.01),
  0px 4px 2px rgba(9, 11, 17, 0.01),
  0px 2px 2px rgba(9, 11, 17, 0.02),
  0px 0px 1px rgba(9, 11, 17, 0.03);

/* Medium - cards, buttons */
--shadow-md:
  0px 28px 11px rgba(9, 11, 17, 0.01),
  0px 16px 10px rgba(9, 11, 17, 0.03),
  0px 7px 7px rgba(9, 11, 17, 0.05),
  0px 2px 4px rgba(9, 11, 17, 0.06);

/* Large - modals, dropdowns */
--shadow-lg:
  0px 62px 25px rgba(9, 11, 17, 0.01),
  0px 35px 21px rgba(9, 11, 17, 0.05),
  0px 16px 16px rgba(9, 11, 17, 0.1),
  0px 4px 9px rgba(9, 11, 17, 0.12);
```

### Gradients

```css
/* Subtle background gradient */
--gradient-subtle: linear-gradient(150deg, var(--gray-900) 19%, var(--gray-999) 150%);

/* Accent gradient for decorative elements */
--gradient-accent: linear-gradient(
  150deg,
  var(--gradient-stop-1),
  var(--gradient-stop-2),
  var(--gradient-stop-3)
);

/* CTA button gradient */
--gradient-accent-orange: linear-gradient(
  150deg,
  #ca7879,
  var(--accent-regular),
  var(--accent-dark)
);

/* Border gradient stroke */
--gradient-stroke: linear-gradient(180deg, var(--gray-900), var(--gray-700));
```

---

## Responsive Design

### Breakpoint

The project uses a **single main breakpoint** at `50em` (800px):

```css
@media (min-width: 50em) {
  /* Desktop styles */
}
```

### Mobile-First Approach

Always write mobile styles first, then add desktop overrides:

```css
/* Mobile (default) */
.component {
  flex-direction: column;
  padding: 1rem;
}

/* Desktop */
@media (min-width: 50em) {
  .component {
    flex-direction: row;
    padding: 2rem;
  }
}
```

### Secondary Breakpoint

A secondary breakpoint at `60em` (960px) is used for navigation social icons:

```css
@media (min-width: 60em) {
  .socials {
    display: flex;
  }
}
```

---

## Theme Support

### Dark Mode Implementation

Dark mode is toggled via a `.theme-dark` class on the `<html>` element:

```css
:root.theme-dark {
  /* Override light mode variables */
  --gray-0: #ffffff;
  --gray-999: #090b11;
  /* ... */
}
```

### Theme-Aware Variable Swapping

In dark mode, the gray scale is **inverted** and accent colors are **adjusted**:

```css
/* Light mode */
--accent-light: #c561f6;
--accent-dark: #1c0056;

/* Dark mode */
:root.theme-dark {
  --accent-light: #1c0056;
  --accent-dark: #c561f6;
}
```

### Targeting Theme States

```css
/* Light mode only */
:root:not(.theme-dark) .element { }

/* Dark mode only */
:root.theme-dark .element { }
:global(.theme-dark) .element { }  /* In scoped component styles */
```

---

## Component Styling Patterns

### Scoped Styles in Astro

Styles in Astro components are automatically scoped:

```astro
<style>
  .component {
    /* Only applies to this component */
  }
</style>
```

### Global Selectors in Components

Use `:global()` to style child elements or external classes:

```css
/* Style slotted content */
.content :global(p) {
  margin-bottom: 1rem;
}

/* Target global class from component */
:global(.theme-dark) .icon {
  color: white;
}
```

### Common Component Patterns

#### Pill/Tag

```css
.pill {
  display: flex;
  padding: 0.5rem 1rem;
  gap: 0.5rem;
  color: var(--accent-text-over);
  border: 1px solid var(--accent-regular);
  background-color: var(--accent-regular);
  border-radius: 999rem;
  font-size: var(--text-md);
  line-height: 1.35;
  white-space: nowrap;
}
```

#### Button/CTA

```css
.cta {
  position: relative;
  display: flex;
  place-content: center;
  padding: 0.56em 2em;
  gap: 0.8em;
  color: var(--accent-text-over);
  text-decoration: none;
  border-radius: 999rem;
  background: var(--gradient-accent-orange);
  box-shadow: var(--shadow-md);
  white-space: nowrap;
}

.cta::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  transition: background-color var(--theme-transition);
  mix-blend-mode: overlay;
}

.cta:hover::after {
  background-color: hsla(var(--gray-999-basis), 0.3);
}
```

#### Card

```css
.card {
  background: var(--gradient-subtle);
  border: 1px solid var(--gray-800);
  border-radius: 0.75rem;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--theme-transition);
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

---

## Animation & Transitions

### Transition Token

```css
--theme-transition: 0.2s ease-in-out;
```

### Usage

```css
.element {
  transition: color var(--theme-transition);
  transition: 
    color var(--theme-transition),
    background-color var(--theme-transition);
}
```

### Reduced Motion Support

```css
@media (prefers-reduced-motion: no-preference) {
  .animated-element {
    transition: transform var(--theme-transition);
  }
}
```

### Keyframe Animation Example

```css
@keyframes scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(calc(-100% / 3));
  }
}

.marquee {
  animation: scroll 30s linear infinite;
  will-change: transform;
}
```

---

## Accessibility

### Screen Reader Only

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

### Focus States

Ensure visible focus indicators:

```css
.link:focus {
  outline: 2px solid var(--accent-regular);
  outline-offset: 2px;
}
```

### Forced Colors Mode

Support Windows High Contrast Mode:

```css
@media (forced-colors: active) {
  .backgrounds {
    background: none;
    background-blend-mode: none;
  }
  
  .link[aria-current='page'] {
    color: SelectedItem;
  }
}
```

### Link Underline Pattern

```css
a {
  text-decoration: 1px solid underline transparent;
  text-underline-offset: 0.25em;
  transition: text-decoration-color var(--theme-transition);
}

a:hover,
a:focus {
  text-decoration-color: currentColor;
}
```

---

## Quick Reference Cheat Sheet

### Colors
```css
var(--gray-0)          /* Primary text */
var(--gray-200)        /* Body text */
var(--gray-400)        /* Muted text */
var(--gray-800)        /* Borders */
var(--gray-999)        /* Background */
var(--accent-regular)  /* Brand color */
```

### Typography
```css
var(--font-body)       /* Public Sans */
var(--font-brand)      /* Rubik */
var(--text-base)       /* 1rem */
var(--text-lg)         /* 1.25rem */
var(--text-2xl)        /* 2.125rem */
```

### Spacing
```css
gap: 0.5rem;           /* .gap-2 */
gap: 1rem;             /* .gap-4 */
gap: 2rem;             /* .gap-8 */
padding: 1.5rem;       /* Standard padding */
border-radius: 0.75rem; /* Standard radius */
border-radius: 999rem; /* Pill/circular */
```

### Effects
```css
var(--shadow-sm)       /* Subtle elevation */
var(--shadow-md)       /* Card elevation */
var(--theme-transition) /* 0.2s ease-in-out */
```
