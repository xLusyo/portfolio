# Portfolio styling guide

The approved source in `docs/Redesign/Portfolio_Mockup_Export.zip` defines the visual direction. Its HTML/CSS/JavaScript are the visual baseline; `assets/reference.png` is inspiration rather than the implementation specification. The live site has no folio wordmark, design-review labels, or Desktop/Mobile presentation switch. The final approved refinement removes the light outer canvas and boxed shell: the layout fills the viewport edge to edge.

## Foundation

`src/styles/portfolio.css` owns the reset, tokens, layout, and portfolio styling. Shared project-card and lightbox styles remain scoped to their Astro components. Use native CSS and existing icons; no styling or animation dependency is required.

- Page and shell: `#030303`; panels: `#121212`. No light outer canvas or surrounding page margins.
- Text: off-white `#f1f1ef`, with readable muted grays and restrained sage focus accents.
- DM Sans is served locally from `public/fonts/`, with Arial/sans-serif fallback. Its OFL license is included there.
- Desktop shell: full viewport width and height, no outer radius or maximum width, 12px internal padding and gap, 330px profile column.
- Keep content panels rounded, spacious, and visually quiet. Use real portfolio screenshots rather than illustrative mock projects. Recent Projects uses three columns above 1024px and one column on tablets and mobile.
- Tech Stack & Tools contains six category cards with technology lists: Backend, Frontend, WordPress, Automation, CRM & Analytics, and Development Tools. Use three columns above 1024px, two at 761–1024px, and one at 760px and below.

## Scrolling and responsive behavior

Above 1024px, the shell is a full-height grid. The profile stays in its grid column without fixed positioning; only the right content column scrolls. The profile information and actions fit without a separate scrollbar. A short-height desktop rule reduces nonessential profile spacing.

At 1024px and below, `.portfolio` becomes the single scroll container. The profile precedes content; `.content` uses `display: contents` so section navigation remains sticky throughout the portfolio. Projects stack. Tools use two columns on tablets and one column at 760px and below. Bottom padding reserves space for the contact bar and device safe area. Neither the document nor a nested content panel should introduce a second mobile scrollbar.

Anchors have sticky-navigation clearance. Active section links use `aria-current="location"`; scrolling and viewport changes update the active link. Resizing across the breakpoint resets both scroll positions.

## Accessibility and images

Controls have visible keyboard focus and comfortable touch targets. Dialogs have accessible names, keyboard dismissal, focus containment/restoration, and background scroll locking. Forced colors retains borders and control outlines. Reduced motion disables smooth scrolling and transitions.

Use `Image` from `astro:assets`, responsive widths/sizes, explicit alt text, and async decoding. The portrait is eagerly loaded with high priority. Project thumbnails are lazy-loaded 16:10 top crops; full-size images remain in inert templates until their dialog opens. Keep `height: auto` on responsive images so HTML dimensions do not stretch them.
