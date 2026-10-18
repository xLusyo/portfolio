# Portfolio styling guide

The approved source in `docs/Redesign/Portfolio_Mockup_Export.zip` defines the visual direction. Its HTML/CSS/JavaScript are the visual baseline; `assets/reference.png` is inspiration rather than the implementation specification. The live site has no folio wordmark, design-review labels, or Desktop/Mobile presentation switch. The final approved refinement removes the light outer canvas and boxed shell: the layout fills the viewport up to 1920px wide and centers on larger screens against the same near-black background.

## Foundation

`src/styles/portfolio.css` owns the reset, tokens, layout, and portfolio styling. Shared project-card and lightbox styles remain scoped to their Astro components. Use native CSS and existing icons. GSAP and ScrollTrigger provide progressive entrance animations; ordinary hover feedback remains in CSS.

- Page and shell: `#030303`; panels: `#121212`. No light outer canvas or surrounding page margins.
- Text: off-white `#f1f1ef`, with readable muted grays and restrained sage focus accents.
- DM Sans is served locally from `public/fonts/`, with Arial/sans-serif fallback. Its OFL license is included there.
- Desktop shell: full viewport height, width capped at 1920px and centered on wider screens, no outer radius, 12px internal padding and gap, 330px profile column. The same near-black background continues outside the capped layout.
- Keep content panels rounded, spacious, and visually quiet. Use real portfolio screenshots rather than illustrative mock projects. Recent Projects uses three columns above 1024px and one column on tablets and mobile.
- Tech Stack & Tools contains six category cards with technology lists: Backend, Frontend, WordPress, Automation, CRM & Analytics, and Development Tools. Use three columns above 1024px, two at 761–1024px, and one at 760px and below.

## Scrolling and responsive behavior

Above 1024px, the shell is a full-height grid. The profile stays in its grid column without fixed positioning; only the right content column scrolls. The profile information and actions fit without a separate scrollbar. A short-height desktop rule reduces nonessential profile spacing.

The desktop portrait grows only to 480px tall and shrinks to fit shorter viewports. Profile information follows with a 12px gap; surplus height remains below the profile contents rather than stretching the portrait or information panel. Tablet and mobile portrait sizing is independent of this desktop cap.

At 1024px and below, `.portfolio` becomes the single scroll container. The profile precedes content; `.content` uses `display: contents` so section navigation remains sticky throughout the portfolio. Projects stack. Tools use two columns on tablets and one column at 760px and below. Bottom padding reserves space for the contact bar and device safe area. Neither the document nor a nested content panel should introduce a second mobile scrollbar.

Anchors have sticky-navigation clearance. Active section links use `aria-current="location"`; scrolling and viewport changes update the active link. Resizing across the breakpoint resets both scroll positions.

## Accessibility and images

Controls have visible keyboard focus and comfortable touch targets. Dialogs have accessible names, keyboard dismissal, focus containment/restoration, and background scroll locking. Forced colors retains borders and control outlines. Reduced motion disables smooth scrolling and transitions.

Use `Image` from `astro:assets`, responsive widths/sizes, explicit alt text, and async decoding. The portrait is eagerly loaded with high priority. Project thumbnails are lazy-loaded 16:10 top crops; full-size images remain in inert templates until their dialog opens. Keep `height: auto` on responsive images so HTML dimensions do not stretch them.

## Portfolio motion

`src/scripts/portfolio-motion-loader.ts` dynamically imports the motion controller only when reduced motion and forced colors are inactive. Static HTML is visible by default; loading or setup errors preserve usable content and report context to the console.

`src/scripts/portfolio-motion.ts` owns scoped GSAP timelines, ScrollTriggers, and cleanup. Desktop uses `.content` as the scroller; tablet/mobile uses `.portfolio`. Match-media changes rebuild the setup while retaining completed reveals. Initially visible content animates immediately; later content reveals around 88% of the scroll area, with clamped starts near the bottom.

- Desktop introduction: portrait, profile information, About headline, summary, and closing link enter with 12px upward travel, a 0.55-second `power2.out` tween, and 80ms stagger. Tablet/mobile introduction groups enter individually when reached.
- Each company entry reveals as one unit with 12px travel over 0.5 seconds.
- Project and tool cards reveal with 16px travel over 0.5 seconds, staggering concurrent entries by 80ms in reading order. Batch size follows the current grid column count.
- Completed entrances do not replay during scrolling, resizing, or preference changes. All temporary transform, opacity, and `will-change` styles are cleared after completion.
- Keyboard focus immediately finishes its entrance. Opacity is used without hiding visibility so pending links remain keyboard-reachable.
- Reduced motion and forced colors revert animation styles immediately. Direct anchor/project visits and restored history pages remain static to preserve native navigation and focus.
- Page exit removes scoped animations, ScrollTriggers, focus listeners, and font listeners. Font completion refreshes measurements. Scrolling stays native; navigation and dialogs keep their existing interactions.

Keep motion hooks on content wrappers, away from scrolling containers, dialog content, and project images whose hover transforms are owned by CSS. Do not pre-hide hooks in a stylesheet.
