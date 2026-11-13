# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Solid, Vite, TypeScript and plain CSS with custom properties, embedded in a Go binary. Chosen by the owner.

## Users

One self-hoster running a homelab, plus anyone on their network. They open pin many times a day, on desktop and phone equally, to jump to a service. They arrive knowing what they want and leave within seconds.

## Product Purpose

pin shows a dashboard of labelled bookmarks in flat groups, from one YAML file, with optional live status on a bookmark's tile. Success is reaching any link in a glance or a couple of keystrokes.

## Positioning

Links, labels, groups and status widgets on the links themselves: one file, no accounts. The server knows nothing about any viewer; each browser keeps its own layout, theme and collapsed groups.

## Operating Context

- Used as a browser start page and from a phone.
- The config is edited in Git and rolled out through a restart, never in the UI.
- Icons load from jsDelivr or direct URLs in the browser. Some may be unavailable, and a monogram stands in.
- Real content: about 38 links in 5 groups, with group sizes from 1 to 19. Names run from short ("Stash") to long ("Proxmox Backup Server"), and descriptions are short phrases.

## Capabilities and Constraints

- Bookmark fields: name, url, optional group, icon, description, label and widget.
- A widget shows live data from the bookmark's app on its tile. Gatus is the first: endpoints up and down, from its public endpoint with no token. The pin server fetches it, and browsers refresh every 30 seconds while visible. A failed read says so on the tile and never blocks the link.
- Labels are defined once at the top of the config, with an optional color. A bookmark has at most one, shown as a small tag.
- Groups are flat and ordered by first appearance. Ungrouped links come last, with no heading.
- A group's title bar collapses it, per browser. Groups start open, and filtering shows matches in collapsed groups.
- Icon sources: dashboard-icons, `mdi-` and `si-` (monochrome, optional hex color), `sh-`, and http(s) URLs. Multicolor logos appear beside monochrome glyphs.
- Settings, per browser: theme (system, light, dark), columns, density, link target, show descriptions.
- Type anywhere to filter by name, description, label or group; Enter opens the top match and Tab moves to the results. Touch devices get a visible search control.
- Installable from the browser's own UI, with no in-app install control and no offline mode. The installed app always opens links outside its window and hides the link target setting. Lacking the browser's pull-to-refresh, it reloads the page when pulled down from the top.
- No auth, no accounts, no in-app editing. No accent or reorder settings. Collapsing is a direct toggle on the group, never a setting.

## Brand Commitments

Name: pin. Modern dashboard feel, with light and dark modes. Must not look like a generic admin template: no sidebar or stat cards that serve no purpose.

Standing preference: the owner chose the familiar dashboard grid over a conceptual world, executed at high craft. Theme inspiration is px0.ai, specifically its sharp corners and mild borders. This is inspiration only; pin never uses px0's name, logo or copy.

## Evidence on Hand

`pin.example.yaml` in this repo is synthetic. The logo is the Quad mark, specified under App Icon in DESIGN.md.

## Product Principles

- Reaching a link beats looking at the dashboard.
- Everything on screen is either a link, a way to reach one, or status carried by the link it describes.
- Desktop and phone are equally first-class.
- A missing icon or a bad config never breaks the page or goes unnoticed.

## Accessibility & Inclusion

WCAG AA contrast in both themes, full keyboard use, visible focus, reduced-motion support, and touch targets of at least 44px.
