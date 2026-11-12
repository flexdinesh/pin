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

THESIS: The familiar dashboard grid, played straight and sharpened: square link tiles sized to their content in justified, interlocking rows rather than floating rounded cards. It refuses sidebars, free-standing stat cards, hero headers and soft shadows. Live status sits inside the tile it describes.

OWN-WORLD: Monochrome: pure white or cool near-black ground, cool neutral ink, amber only as the accent for focus, top match and selected settings, red only on a non-zero down count. IBM Plex Sans throughout, Lucide icons with square caps, zero radius everywhere, low-alpha hairlines as the only elevation. Each group has a neutral title bar with a small tracked uppercase label and a count, and no container around its tiles. Tiles sit 8px apart, each as wide and as tall as its content, with full rows stretched to both edges. Theme inspired by px0.ai.

STORY: The visitor sees every link at once, recognizes it by logo and name, and leaves. Typing narrows the grid, and Enter opens the top match.

FIRST VIEWPORT: Sticky top bar with a home icon, "/" and the config title at left, filter input in the middle at up to 420px, cog at far right. Below, groups stack at full width in config order, their tiles packed by content size. On phones the filter takes its own row and tiles stay in two lanes, with a tile that does not fit taking both.

FORM: category standard, seed:8fba89e25c6128a2

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
