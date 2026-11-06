---
version: 1
slug: "apps-web-src-app-tsx"
primary_target: "apps/web/src/App.tsx"
related_targets: []
---

# pin dashboard

Scope: the single dashboard screen. Mode: Operate. Build path: code-led. Decided on a text-and-preview fallback because the decision page reported no browser.

Audience and job: one self-hoster, desktop and phone equally, jumping to a service within seconds. Content: about 38 links in 5 groups, sizes 1 to 19.

Unresolved: none.

## Direction contract

THESIS: The familiar dashboard grid, played straight and sharpened: a precise joined grid of links rather than floating rounded tiles. It refuses sidebars, stat cards, hero headers and soft shadows.

OWN-WORLD: Monochrome: pure white or cool near-black ground, cool neutral ink, amber only as the accent for focus, top match and selected settings. IBM Plex Sans throughout, Lucide icons with square caps, zero radius everywhere, low-alpha hairlines as the only elevation. Group panels have a neutral header strip with a small tracked uppercase label and a count. Cells share borders with no gaps. Theme inspired by px0.ai.

STORY: The visitor sees every link at once, recognizes it by logo and name, and leaves. Typing narrows the grid, and Enter opens the top match.

FIRST VIEWPORT: Sticky top bar with a home icon, "/" and the config title at left, filter input in the middle at up to 420px, cog at far right. Below, group panels fill the width in config order. On phones the filter takes its own row and cells stay in two columns.

FORM: category standard, seed:8fba89e25c6128a2

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
