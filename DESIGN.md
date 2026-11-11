---
name: pin
description: Square link tiles on precise lanes in light and dark, sharp corners and mild borders.
colors:
  bg: "light-dark(#ffffff, #06070b)"
  panel: "light-dark(#ffffff, #0b0c12)"
  strip: "light-dark(#f2f3f6, #11131c)"
  hover: "light-dark(#0b0d140a, #c0caf50e)"
  border: "light-dark(#0b0d141a, #c0caf51c)"
  border-strong: "light-dark(#0b0d1438, #c0caf533)"
  text: "light-dark(#0b0d14, #e4e8f7)"
  text-2: "light-dark(#454c5e, #a2aaca)"
  text-3: "light-dark(#5c6376, #8088aa)"
  down: "light-dark(#b91c1c, #f87171)"
  accent: "light-dark(#b45309, #fbbf24)"
  accent-wash: "light-dark(#b4530912, #fbbf2412)"
  accent-line: "light-dark(#b4530980, #fbbf2466)"
  icon-halo: "light-dark(#0b0d1459, #e4e8f7cc)"
  icon-halo-2: "light-dark(transparent, #e4e8f799)"
# Desktop defaults; mobile overrides and browser-default px equivalents are in Typography.
typography:
  title:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  name:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
  description:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.78125rem"
    fontWeight: 400
    lineHeight: 1.4
  control:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.1em"
  legend:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.65625rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.1em"
  count:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "'tnum'"
  figure:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: "1.375rem"
    fontFeature: "'tnum'"
rounded:
  none: "0px"
spacing:
  gutter: "clamp(16px, 2vw, 24px)"
  inline: "8px"
  group-gap: "20px"
  tile-gutter: "8px"
  panel-inline: "14px"
  cell-padding: "9px 14px"
  cell-padding-compact: "7px 10px"
  cell-gap: "12px"
  cell-gap-compact: "9px"
  cell-min: "clamp(160px, 22vw, 244px)"
  cell-min-compact: "clamp(150px, 17vw, 190px)"
# Desktop defaults unless a shared CSS dimension is referenced; mobile behavior is below.
components:
  bar:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    typography: "{typography.title}"
    padding: "calc(10px + env(safe-area-inset-top)) var(--gutter-end) 10px var(--gutter-start)"
  filter:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    height: "var(--filter-height)"
    padding: "0 2px 0 10px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
    rounded: "{rounded.none}"
    size: "var(--bar-control-height)"
  icon-button-hover:
    backgroundColor: "{colors.hover}"
    textColor: "{colors.text}"
  button:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    height: "34px"
    padding: "0 12px"
  button-hover:
    backgroundColor: "{colors.hover}"
  segment:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-2}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    height: "auto"
  segment-hover:
    backgroundColor: "{colors.hover}"
  segment-selected:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.text}"
  group-header:
    backgroundColor: "{colors.strip}"
    textColor: "{colors.text-2}"
    typography: "{typography.label}"
    padding: "7px 14px"
  cell:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    typography: "{typography.name}"
    rounded: "{rounded.none}"
    height: "44px"
    padding: "{spacing.cell-padding}"
  cell-compact:
    padding: "{spacing.cell-padding-compact}"
  cell-hover:
    backgroundColor: "{colors.hover}"
  cell-top:
    backgroundColor: "{colors.accent-wash}"
  enter-hint:
    textColor: "{colors.accent}"
    rounded: "{rounded.none}"
    padding: "2px 4px"
  tag:
    textColor: "{colors.text-2}"
    typography: "{typography.count}"
    rounded: "{rounded.none}"
    padding: "1px 5px"
  readout:
    textColor: "{colors.text-2}"
    typography: "{typography.count}"
    rounded: "{rounded.none}"
    padding: "4px 14px"
  readout-figure:
    textColor: "{colors.text}"
    typography: "{typography.figure}"
  readout-down:
    textColor: "{colors.down}"
  monogram:
    textColor: "{colors.text-2}"
    rounded: "{rounded.none}"
    size: "26px"
  settings-panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    rounded: "{rounded.none}"
    width: "348px"
  notice:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.none}"
    padding: "20px"
---

# Design System: pin

## Overview

**Creative North Star: "The Sharpened Grid"**

The familiar dashboard grid, played straight and sharpened. Links sit in square tiles on precise lanes instead of floating rounded cards, so the screen can be scanned at a glance. Nothing competes with the links: the only chrome above the grid is a thin top bar holding the title, a filter field, and a settings control.

The world is monochrome and quiet by construction. A pure white or cool near-black ground, cool neutral ink, one typeface, zero radius, and low-alpha hairlines do all the structural work. Density is high and even, with every link given the same weight, because the visitor arrives knowing what they want. Color arrives from four places only: the logos themselves, small squares on configured labels, a single amber signal that marks where input is and what Enter will do, and red on a count of things that are down.

This system rejects sidebars, free-standing stat cards, hero headers, and soft shadows. It is a dashboard and does not pretend otherwise; the craft is in the precision of the grid rather than in a concept layered over it.

**Key Characteristics:**

- Square tiles on lanes, 8px apart, widening to two lanes only when their content needs it
- Neutral title bars with a small tracked uppercase group name and a tabular count
- Zero radius on every surface and control
- One amber accent, reserved for focus, top match, and selected settings
- Light and dark themes defined as single paired tokens

## Colors

Cool neutrals tinted slightly toward blue, plus one amber that is darker and burnt in light mode and bright in dark mode. Every token is one `light-dark()` pair, so a theme is never a separate palette. The values below read light, then dark.

### Primary

- **Signal Amber** (#b45309, #fbbf24): The focus ring, filter caret, text selection, the top match's Enter hint, the selected setting's ring, and native accent color. The favicon sets the same bright amber on the dark ground.
- **Amber Wash** (#b4530912, #fbbf2412): The fill behind the top match and the selected setting.
- **Amber Line** (#b4530980, #fbbf2466): The softer ring around the top match and the border of its Enter hint.

### Status

- **Down Red** (#b91c1c, #f87171): A widget's non-zero down count, figure and label together. The word "down" always accompanies it, so the state never depends on color alone.

### Neutral

- **Ground** (#ffffff, #06070b): The page and sticky bar.
- **Panel** (#ffffff, #0b0c12): Tiles, the filter field, the settings panel, and notices. Equal to the ground in light mode, one step lifted in dark.
- **Strip** (#f2f3f6, #11131c): Group title bars only.
- **Hover Tint** (#0b0d140a, #c0caf50e): The hover and pressed fill on any interactive surface.
- **Hairline** (#0b0d141a, #c0caf51c): Tile and title bar outlines, the bar's bottom edge, and dividers between settings.
- **Firm Hairline** (#0b0d1438, #c0caf533): Control outlines (filter, buttons, segments, monogram), label tags, and the settings panel, which must separate from what it overlays.
- **Ink** (#0b0d14, #e4e8f7): Link names, titles, and typed text.
- **Soft Ink** (#454c5e, #a2aaca): Descriptions, group names, label tags, resting icons, and notice copy.
- **Faint Ink** (#5c6376, #8088aa): Counts, legends, placeholder, and the title separator. It holds at least 5.3:1 on every surface it appears on in both themes.
- **Logo Halo** (#0b0d1459, #e4e8f7cc; second pass transparent, #e4e8f799): A tight outline behind image logos so a dark logo stays visible on dark panels and a light logo on light ones.

### Named Rules

**The One Signal Rule.** In the interface, amber marks only where input is and what Enter will do: focus, caret, selection, top match, and selected setting. It never decorates and never signals hover.

**The Content Color Rule.** Hue beyond amber and Down Red comes only from configured content: bookmark icons, including monochrome icons given their own color, and the square on a label given a color. Chrome stays neutral, and text never takes a configured color, so contrast holds for any value.

**The Down Rule.** Red marks only a count of things that are down, and only above zero. A healthy dashboard shows no red, and a zero stays in faint ink.

## Typography

**Body Font:** IBM Plex Sans Variable (with system-ui, -apple-system, Segoe UI, sans-serif)

**Character:** One humanist grotesque with an engineered edge throughout. It reads technical without resorting to a monospace, and its range of weights carries the whole hierarchy.

### Hierarchy

The root stays at `100%` to honor browser text settings; the Body role is applied on `body`. All role sizes use rem. Desktop sizes remain unchanged at the browser default of 16px. The mobile scale applies at `max-width: 640px` **or** `pointer: coarse`, including touch devices in landscape. The px equivalents below assume that browser default; they grow with the user's text setting.

| Role | CSS token | Desktop rem (px) | Mobile rem (px) |
| --- | --- | --- | --- |
| Title | `--font-title` | 0.875rem (14px) | 1.0625rem (17px) |
| Body / Name | `--font-body` | 0.875rem (14px) | 1.0625rem (17px) |
| Description | `--font-description` | 0.78125rem (12.5px) | 0.9375rem (15px) |
| Control | `--font-control` | 0.75rem (12px) | 1rem (16px) |
| Label | `--font-label` | 0.6875rem (11px) | 0.8125rem (13px) |
| Legend | `--font-legend` | 0.65625rem (10.5px) | 0.8125rem (13px) |
| Count / Tag | `--font-count` | 0.6875rem (11px) | 0.8125rem (13px) |
| Figure | `--font-figure` | 1.125rem (18px) | 1.25rem (20px) |

- **Title** (600, 1.4): The config title in the bar and the first line of a notice. The system has no display or headline size.
- **Body** (400, 1.4): Filter text, notice copy, and button labels. The filter inherits the primary Body size, including 17px on mobile.
- **Name** (500, 1.4): Link names. Long names wrap instead of truncating.
- **Description** (400, 1.4): The short phrase under a link name. One line with an ellipsis, or up to two lines at 640px and below.
- **Control** (400, 1.4): Segment labels, stepping to 600 when selected. Labels can wrap as text grows.
- **Label** (600, 0.1em, uppercase): Group names in title bars.
- **Legend** (400, 0.1em, uppercase): The name of a settings group.
- **Count** (400, tabular numerals): Group counts, the filter's match count, label tags, which keep the name as written, and readout labels.
- **Figure** (600, tabular numerals): A widget's live counts, and nothing else. Its line height is `--readout-line-height`: 1.375rem (22px) on desktop and 1.625rem (26px) on mobile. It sets the system's one step above Title.

### Named Rules

**The One Family Rule.** IBM Plex Sans carries every role. Hierarchy comes from weight and small size steps, never a second face.

**The Real Structure Rule.** Tracked uppercase names real structure only: a group or a set of controls it directly labels. It never sits as a decorative line above other text.

**The Tabular Count Rule.** Any number that changes while filtering uses tabular numerals, so counts do not jitter.

## Layout

A single full-width column of groups in config order, with a gutter of 16px to 24px and 20px between groups. There is no sidebar and no maximum content width: the grid fills the window.

The sticky bar is a three-track grid: title at left, filter in the middle at up to 420px, settings control at far right. At 640px and below, the filter drops to its own full-width row under the title and settings control. The settings control comes before the filter in the DOM and is placed by the grid, so Tab from the filter reaches the results directly. The document's top scroll padding follows the bar's height, so a focused link never sits under it.

The shared bar height derives from the control and filter dimensions: their maximum plus 21px and the top safe-area inset in one row; their sum plus 29px and the top inset in two rows. The settings popover uses that same height for its top offset and available height. The viewport uses `viewport-fit=cover`. Header and content side gutters take the larger of the normal gutter and each side's safe-area inset; the header adds the top inset, and content bottom padding takes the larger of its gutter and the bottom inset. The phone bottom sheet adds bottom and side safe-area padding and leaves at least 16px or the top inset above its maximum height.

Tiles use an auto-filling grid of lanes with a minimum track that responds to the viewport (160px to 244px, or 150px to 190px at compact density), 8px apart. A chosen column count caps the lanes at that number, and they narrow to 150px before a lane drops. Each row takes the height of its tallest tile, which its neighbors stretch to match, so tile tops line up across lanes. Phones target two lanes; below 360px the minimum track falls to 130px to hold them.

A tile whose content does not fit one lane takes two. The content is measured because it depends on rendered text, and grid placement does the rest, so tiles keep config order. Larger text naturally produces more two-lane tiles and taller cells. A two-lane tile that does not fit at a row's end moves to the next row and leaves its lane open, as do empty lanes in the last row. There is no filler.

Density is one switch, not many: compact tightens the cell padding, gap, minimum track, and icon together. It never reduces role font sizes. Spacing otherwise steps through 8px inside controls and between tiles, 12px between cell contents, 20px between groups, and 14px as the inline inset of title bars.

At 640px and below or on a coarse pointer, controls reach at least 44px and the filter grows to 2.875rem (46px), with primary Body text. Navigation glyphs grow from 1.0625rem (17px) to 1.375rem (22px); search and clear glyphs grow from 1rem (16px) to 1.25rem (20px). The settings button uses 2.125rem (34px) on desktop and 2.75rem (44px) on mobile. Cells hold a 44px minimum height at every density and on every pointer. A cell's hover fill applies only where the device can hover; touch gets the same fill while pressed.

### Named Rules

**The Lane Rule.** Inside a group, tiles sit on equal lanes, in rows sized to their tallest tile, 8px apart. A tile takes a second lane only when its content does not fit one.

**The Everything Is Visible Rule.** All links are on the page at rest, unless the viewer folded their group. Groups start open, the filter reaches inside folded ones, and the grid never paginates or scrolls within a group.

## Elevation & Depth

Flat. Depth comes from tonal steps (ground, panel, strip) and hairlines. The sticky bar and the settings panel float over content with no shadow at all, separated only by their opaque fill and a border.

`box-shadow` appears only as a way to draw zero-blur lines where a border would shift layout.

### Shadow Vocabulary

- **Selected ring** (`box-shadow: inset 0 0 0 1px var(--accent)`): A selected segment.
- **Top match ring** (`box-shadow: inset 0 0 0 1px var(--accent-line)`): The cell Enter will open.
- **Logo halo** (`filter: drop-shadow(0 0 1px var(--icon-halo)) drop-shadow(0 0 1px var(--icon-halo-2))`): Image logos only. A legibility aid for third-party artwork, and the only blur in the system. Bookmarks set `halo: false` for logos that are opaque tiles, where it would trace a frame.

### Named Rules

**The Hairline Elevation Rule.** No surface casts a shadow. If two layers need separating, use a tonal step or a hairline.

## Shapes

Every corner is square (0px). Outlines are 1px, at two strengths: a mild hairline for structure and a firm one for controls. Icons follow the same geometry, with Lucide strokes at 1.75 set to square caps and miter joins. The missing-icon monogram is a bordered square.

### Named Rules

**The Zero Radius Rule.** Every surface and control the system draws has square corners. Bookmark logos are third-party artwork and keep their own silhouettes.

## Components

Motion across all of these is limited to a 100ms ease-out change of color or background on cells and icon buttons. Nothing moves, except the groups under the finger during Pull to Reload, and reduced-motion removes transitions entirely. Every control shows a 2px amber focus ring offset by 2px unless noted.

### Buttons

Plain, with no filled variant.

- **Shape:** Square (0px).
- **Text button:** Transparent with a firm hairline outline, ink label, 34px minimum height on desktop and 44px on mobile, with 12px inline padding. Used only for notice recovery actions such as retry and clear filter.
- **Icon button:** Transparent with no outline, holding a navigation glyph in soft ink. Button and glyph dimensions follow the desktop and mobile sizes in Layout. Its glyph lines up with the content edge, matching the home icon opposite, with its target kept inside the viewport.
- **Hover / Focus:** Hover adds the hover tint, and an icon button's icon steps up to ink.

### Chips

Settings choices are segmented radio rows rather than free chips.

- **Style:** Equal-width segments on panel fill inside one firm outline, split by 1px firm hairline gaps. Minimum height 30px on desktop and 44px on mobile, with an optional 14px icon. Labels can wrap for larger text, increasing the row height.
- **Columns:** Only the seven column radio choices wrap into multiple rows. Below 314px of available fieldset content width (`max-width: 313px`), they form four choices then three, with equal widths filling each row and a 44px minimum choice width. Wrapping preserves their radio behavior.
- **State:** Selected takes the amber wash, a 1px amber inset ring, ink text, and weight 600. Hover takes the hover tint.

### Cards / Containers

- **Corner Style:** Square (0px).
- **Groups:** No container. A group is a title bar with its tiles on the page ground below it, and ungrouped links are tiles with no title bar.
- **Background:** Panel on tiles and notices, strip on title bars.
- **Shadow Strategy:** None; see Elevation & Depth.
- **Border:** 1px hairline.
- **Internal Padding:** Title bar 7px by 14px. Notices use 20px with an 8px stack.

### Inputs / Fields

- **Style:** Panel fill with a firm hairline, 2.125rem (34px) tall on desktop and 2.875rem (46px) on mobile, holding a search icon, the input in the Body role, and once there is a query, a count and a clear control. Mobile search glyphs are 1.25rem (20px), and the clear target is 44px square.
- **Focus:** The whole field's border turns amber and the caret is amber. This replaces the ring on the input.
- **Placeholder:** Faint ink at full opacity.
- **Clear control:** Out of the Tab order, because Escape does the same. Clicking it clears and returns focus to the field.
- **Announcements:** A visually hidden status stays mounted and reads the result count or "No matches". The visible count is hidden from assistive technology.

### Navigation

- **Top bar:** Opaque ground with a bottom hairline, sticky. Left side reads as a short path: a home icon in the navigation glyph size, a faint slash, then the config title in title weight, truncating with an ellipsis when space runs out.
- **Settings panel:** A popover anchored under the shared bar height at the safe-area-aware right gutter, 348px wide, on panel fill with a firm hairline. At 640px and below it becomes a full-width bottom sheet with only a top border, bottom and side safe-area padding, and a viewport-constrained scrollable height.

### Bookmark Cell

The signature element. A whole-tile link at a 44px minimum height, with a hairline outline on panel fill: a 26px icon (20px at compact), then a name with an optional description.

- **Hover / Pressed:** Hover tint.
- **Focus:** The amber ring sits inside the tile (offset -2px).
- **Top match:** While filtering, the cell Enter will open takes the amber wash, the softer amber ring, and a small outlined Enter hint at its far end. Coarse pointers hide the hint. Once a result has keyboard focus, Enter opens that result, so the wash and hint move to it and the top match returns to rest.
- **Icon:** Multicolor logos and single-color masks share a contained box. When a source is missing or fails, a monogram stands in: the name's first letter or digit in weight 600 at half the icon size, in soft ink, in a bordered square.
- **Label tag:** At the tile's far end, before any Enter hint, at rest and in results: the label's name in the Count role and soft ink, in a firm hairline outline, truncating past 16ch. On phones and coarse pointers, the tag occupies at most 45% of its row so enlarged labels leave room for the bookmark name and cannot push the tile outside the viewport. A configured color adds a 6px square before the name. Its width counts when a tile is measured, so a tag can take a tile to a second lane.

### Widget Readout

The bottom of a bookmark cell whose bookmark has a widget, inside the same link. Two equal cells under the name row, split by hairlines that run to the tile's edges with no gutter: a figure and its label on one baseline.

- **Healthy:** Up in ink. A zero down in faint ink.
- **Down:** A non-zero down count takes Down Red, and its label steps from Count weight to 600.
- **Loading:** Dashes in faint ink, hidden from assistive technology. Nothing moves.
- **Unreachable:** One line in faint ink, "Can't reach Gatus", at the same height. The link still works, and old counts never stay on screen.
- **Top match and focus:** The whole tile takes them as any cell does; the readout adds nothing.
- **Layout:** Excluded when a tile is measured, so counts arriving or changing never move it to another lane. The whole tile keeps its height between refreshes. A group holding a widget aligns every tile's content to the top, so names share a line, with each icon centered on its text. In a narrow lane the figure holds and its label clips. Counts refresh without a live region, so a screen reader is not interrupted.

### Group Header

A full-width strip-toned title bar with a hairline outline: a 14px chevron and the group name at left, a count at far right. It sits 8px above its tiles and contains nothing else. While filtering, the count reads as shown over total.

- **Fold:** The whole bar is one button, reaching 44px at 640px and below or on coarse pointers. Hover and pressed add the hover tint, and focus draws the amber ring inside the bar. Folding removes the tiles at once, the chevron swaps without animating, and consecutive folded bars sit 8px apart. State is saved per browser.
- **While filtering:** Matching groups show open whatever their saved state, and the bar is disabled with a faint chevron, so Tab from the filter reaches results directly.
- **Ungrouped links:** No bar, so they never fold.

### Pull to Reload

The installed app's stand-in for the browser's pull-to-refresh, which installed apps lack. Browser tabs keep their own gesture and never show it.

- **Gesture:** One finger dragging down from the top of the page, starting outside the settings sheet. Upward or sideways drags, a second finger, or a scrolled page leave it to the browser. The installed app sets `overscroll-behavior-y: none`, so the page never bounces.
- **Follow:** The bar stays put. The groups follow the finger at half its travel, up to 96px, and a strip on the ground fills the gap under the bar: an arrow and a line of copy, centered, in the Control role and soft ink.
- **Armed:** At 64px the arrow swaps from down to up without rotating, the copy changes from "Pull to reload" to "Release to reload", and both step up to ink. There is no haptic.
- **Release:** Released while armed, the groups hold at 64px with a static rotate glyph and "Reloading" in ink, and the page reloads. Released earlier, the groups and strip settle back over 150ms ease-out, or at once under reduced motion.
- **Accessibility:** The strip is hidden from assistive technology, because the touch gesture is its own feedback.

### Notice

An inline panel in the content column for the empty, no-match, and load-failure states: a title line, short plain copy, and a text button when there is a recovery action.

### App Icon

The Quad mark on the dark ground, in both themes: four square tiles, three strict in neutral `#454b63`, and the top-left one loose in bright amber, hanging off axis from its pin. The neutral belongs to the mark and is not a UI token. The loose tile is the only rotated shape in the system.

There are two drawings. `src/favicon.svg` is the small-size cut: 8-unit tiles, a 4-unit gap and a 6-unit margin that land on whole pixels at 16px, with the loose tile at full tile size, 18° and no pin hole, because the hole blurs at 16px. `src/icon.svg` and `src/icon-maskable.svg` carry the full mark, with an 11-unit tile at 14° and a 3-unit pin hole, at 64% and 51% scale. The ground keeps the mark about 22% from each edge at 64%, and 51% clears the maskable safe zone with room to spare. `apps/web/public/icons/` holds PNGs rendered with `rsvg-convert`: 192, 512 and 180 (Apple touch) from `src/icon.svg`, and a 512 maskable from `src/icon-maskable.svg`. Change the SVG and re-render; never edit the PNGs.

The top bar keeps its home icon; the mark does not appear in the interface. `docs/logo-dark.svg` and `docs/logo-light.svg` are the README lockup: the mark with no ground, plus "pin" in IBM Plex Sans 600 converted to outlines, with the loose tile in Signal Amber's dark and light values.

## Do's and Don'ts

### Do:

- **Do** define every new color as one `light-dark()` pair, and meet WCAG AA in both themes.
- **Do** use zero radius and a 1px hairline on every new surface and control.
- **Do** keep tiles on lanes inside a group, widening a tile only when its content does not fit.
- **Do** reserve amber for focus, the top match, and selected settings.
- **Do** use Lucide icons at stroke 1.75 with square caps and miter joins.
- **Do** give a monogram fallback to anything that loads an external icon.
- **Do** keep every control at 44px or more at 640px and below or on coarse pointers.
- **Do** preserve browser text settings with a 100% root and rem role sizes; compact density changes spacing and icons, never fonts.
- **Do** match the existing 100ms ease-out for color and background transitions, and honor reduced motion.
- **Do** put a widget's status inside the tile it describes, so it stays part of the link.

### Don't:

- **Don't** add a sidebar, a stat card that is not a link, or a hero header.
- **Don't** round corners on anything the system draws.
- **Don't** add shadows to surfaces. `box-shadow` only draws 1px zero-blur rules and inset rings, and the logo halo is the only blur.
- **Don't** introduce a second typeface or a display or headline size.
- **Don't** use amber for hover, decoration, or emphasis in copy.
- **Don't** tint chrome with a second hue; logos, configured label squares and a non-zero down count are the only other color.
- **Don't** use tracked uppercase as a decorative line above other text.
- **Don't** animate position, scale, or layout. The one exception is the Pull to Reload settle.
