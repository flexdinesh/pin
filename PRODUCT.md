# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Solid, Vite, TypeScript and plain CSS with custom properties, embedded in a Go binary. Chosen by the owner.

## Users

One self-hoster running a homelab, plus anyone on their network. They open pin many times a day, on desktop and phone equally, to jump to a service. They arrive knowing what they want and leave within seconds.

## Product Purpose

pin shows a dashboard of bookmarks in flat groups, from one YAML file. It replaces a gethomepage deployment for people who use it only for links. Success is reaching any link in a glance or a couple of keystrokes.

## Positioning

Links and groups only: one file, no widgets, no status, no accounts. The server knows nothing about any viewer; each browser keeps its own layout and theme.

## Operating Context

- Used as a browser start page and from a phone.
- The config is edited in Git and rolled out through a restart, never in the UI.
- Icons load from jsDelivr or direct URLs in the browser. Some may be unavailable, and a monogram stands in.
- Real content: about 38 links in 5 groups, with group sizes from 1 to 19. Names run from short ("Stash") to long ("Proxmox Backup Server"), and descriptions are short phrases.

## Capabilities and Constraints

- Bookmark fields: name, url, optional group, icon and description.
- Groups are flat and ordered by first appearance. Ungrouped links come last, with no heading.
- Icon sources: dashboard-icons, `mdi-` and `si-` (monochrome, optional hex color), `sh-`, and http(s) URLs. Multicolor logos appear beside monochrome glyphs.
- Settings, per browser: theme (system, light, dark), columns, density, link target, show descriptions.
- Type anywhere to filter; Enter opens the top match and Tab moves to the results. Touch devices get a visible search control.
- Installable from the browser's own UI, with no in-app install control and no offline mode. The installed app always opens links outside its window and hides the link target setting.
- No auth, no accounts, no in-app editing. No accent, collapse or reorder settings.

## Brand Commitments

Name: pin. Modern dashboard feel, with light and dark modes. Must not look like a generic admin template: no sidebar or stat cards that serve no purpose.

Standing preference: the owner chose the familiar dashboard grid over a conceptual world, executed at high craft. Theme inspiration is px0.ai, specifically its sharp corners and mild borders. This is inspiration only; pin never uses px0's name, logo or copy.

## Evidence on Hand

The owner's real config of 38 links is in the k8s-cluster repo. `pin.example.yaml` in this repo is synthetic. No logo or other brand assets exist.

## Product Principles

- Reaching a link beats looking at the dashboard.
- Everything on screen is either a link or a way to reach one.
- Desktop and phone are equally first-class.
- A missing icon or a bad config never breaks the page or goes unnoticed.

## Accessibility & Inclusion

WCAG AA contrast in both themes, full keyboard use, visible focus, reduced-motion support, and touch targets of at least 44px.
