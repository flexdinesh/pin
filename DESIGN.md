---
name: pin
description: A precise joined grid of links in light and dark, sharp corners and mild borders.
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
  accent: "light-dark(#b45309, #fbbf24)"
  accent-wash: "light-dark(#b4530912, #fbbf2412)"
  accent-line: "light-dark(#b4530980, #fbbf2466)"
  icon-halo: "light-dark(#0b0d1459, #e4e8f7cc)"
  icon-halo-2: "light-dark(transparent, #e4e8f799)"
typography:
  title:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  name:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
  description:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.4
  control:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.1em"
  legend:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "10.5px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.1em"
  count:
    fontFamily: "'IBM Plex Sans Variable', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "'tnum'"
rounded:
  none: "0px"
spacing:
  gutter: "clamp(16px, 2vw, 24px)"
  inline: "8px"
  group-gap: "12px"
  panel-inline: "14px"
  cell-padding: "9px 14px"
  cell-padding-compact: "7px 10px"
  cell-gap: "12px"
  cell-gap-compact: "9px"
  cell-min: "clamp(160px, 22vw, 244px)"
  cell-min-compact: "clamp(150px, 17vw, 190px)"
components:
  bar:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.text}"
    typography: "{typography.title}"
    padding: "10px clamp(16px, 2vw, 24px)"
  filter:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.none}"
    height: "34px"
    padding: "0 2px 0 10px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
    rounded: "{rounded.none}"
    size: "34px"
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
    backgroundColor: "transparent"
    textColor: "{colors.text-2}"
    typography: "{typography.control}"
    rounded: "{rounded.none}"
    height: "30px"
  segment-hover:
    backgroundColor: "{colors.hover}"
  segment-selected:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.text}"
  group-panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.none}"
  group-header:
    backgroundColor: "{colors.strip}"
    textColor: "{colors.text-2}"
    typography: "{typography.label}"
    padding: "7px 14px"
  cell:
    backgroundColor: "transparent"
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

The familiar dashboard grid, played straight and sharpened. Links sit in a precise joined grid instead of floating rounded tiles, so the screen reads as one ruled sheet that can be scanned at a glance. Nothing competes with the links: the only chrome above the grid is a thin top bar holding the title, a filter field, and a settings control.

The world is monochrome and quiet by construction. A pure white or cool near-black ground, cool neutral ink, one typeface, zero radius, and low-alpha hairlines do all the structural work. Density is high and even, with every link given the same weight, because the visitor arrives knowing what they want. Color arrives from two places only: the logos themselves, and a single amber signal that marks where input is and what Enter will do.

This system rejects sidebars, stat cards, hero headers, and soft shadows. It is a dashboard and does not pretend otherwise; the craft is in the precision of the grid rather than in a concept layered over it.

**Key Characteristics:**

- Joined cells that share hairlines, with no gaps inside a group
- Neutral header strips with a small tracked uppercase group name and a tabular count
- Zero radius on every surface and control
- One amber accent, reserved for focus, top match, and selected settings
- Light and dark themes defined as single paired tokens

## Colors

Cool neutrals tinted slightly toward blue, plus one amber that is darker and burnt in light mode and bright in dark mode. Every token is one `light-dark()` pair, so a theme is never a separate palette. The values below read light, then dark.

### Primary

- **Signal Amber** (#b45309, #fbbf24): The focus ring, filter caret, text selection, the top match's Enter hint, the selected setting's ring, and native accent color. The favicon sets the same bright amber on the dark ground.
- **Amber Wash** (#b4530912, #fbbf2412): The fill behind the top match and the selected setting.
- **Amber Line** (#b4530980, #fbbf2466): The softer ring around the top match and the border of its Enter hint.

### Neutral

- **Ground** (#ffffff, #06070b): The page and sticky bar.
- **Panel** (#ffffff, #0b0c12): Group panels, the filter field, the settings panel, and notices. Equal to the ground in light mode, one step lifted in dark.
- **Strip** (#f2f3f6, #11131c): Group header strips only.
- **Hover Tint** (#0b0d140a, #c0caf50e): The hover and pressed fill on any interactive surface.
- **Hairline** (#0b0d141a, #c0caf51c): Panel outlines, cell rules, the bar's bottom edge, and dividers between settings.
- **Firm Hairline** (#0b0d1438, #c0caf533): Control outlines (filter, buttons, segments, monogram) and the settings panel, which must separate from what it overlays.
- **Ink** (#0b0d14, #e4e8f7): Link names, titles, and typed text.
- **Soft Ink** (#454c5e, #a2aaca): Descriptions, group names, resting icons, and notice copy.
- **Faint Ink** (#5c6376, #8088aa): Counts, legends, placeholder, and the title separator. It holds at least 5.3:1 on every surface it appears on in both themes.
- **Logo Halo** (#0b0d1459, #e4e8f7cc; second pass transparent, #e4e8f799): A tight outline behind image logos so a dark logo stays visible on dark panels and a light logo on light ones.

### Named Rules

**The One Signal Rule.** In the interface, amber marks only where input is and what Enter will do: focus, caret, selection, top match, and selected setting. It never decorates and never signals hover.

**The Content Color Rule.** Hue beyond amber comes only from bookmark icons, including monochrome icons given their own configured color. Chrome stays neutral.

## Typography

**Body Font:** IBM Plex Sans Variable (with system-ui, -apple-system, Segoe UI, sans-serif)

**Character:** One humanist grotesque with an engineered edge throughout. It reads technical without resorting to a monospace, and its range of weights carries the whole hierarchy.

### Hierarchy

- **Title** (600, 14px, 1.4): The config title in the bar and the first line of a notice. The system has no display or headline size.
- **Body** (400, 14px, 1.4): The root size. Filter text, notice copy, and button labels.
- **Name** (500, 14px, 1.4): Link names. Long names wrap instead of truncating.
- **Description** (400, 12.5px, 1.4): The short phrase under a link name. One line with an ellipsis, or up to two lines on phones.
- **Control** (400, 12px, 1.4): Segment labels, stepping to 600 when selected.
- **Label** (600, 11px, 0.1em, uppercase): Group names in header strips.
- **Legend** (400, 10.5px, 0.1em, uppercase): The name of a settings group.
- **Count** (400, 11px, tabular numerals): Group counts and the filter's match count.

### Named Rules

**The One Family Rule.** IBM Plex Sans carries every role. Hierarchy comes from weight and small size steps, never a second face.

**The Real Structure Rule.** Tracked uppercase names real structure only: a group or a set of controls it directly labels. It never sits as a decorative line above other text.

**The Tabular Count Rule.** Any number that changes while filtering uses tabular numerals, so counts do not jitter.

## Layout

A single full-width column of group panels in config order, with a gutter of 16px to 24px and 12px between panels. There is no sidebar and no maximum content width: the grid fills the window.

The sticky bar is a three-track grid: title at left, filter in the middle at up to 420px, settings control at far right. At 640px and below, the filter drops to its own full-width row under the title and settings control.

Cells use an auto-filling grid with a minimum track that responds to the viewport (160px to 244px, or 150px to 190px at compact density). A chosen column count caps the tracks at that number, and they narrow to 150px before a column drops. Phones target two columns; at 353px and below the minimum track falls to 130px to hold them. Empty tracks in the last row stay as open panel space, with no filler.

Density is one switch, not many: compact tightens the cell padding, gap, minimum track, and icon together. Spacing otherwise steps through 8px inside controls, 12px between panels and cell contents, and 14px as the inline inset of panels.

On a coarse pointer every control reaches at least 44px and the filter grows to 46px with 16px text. Cells hold a 44px minimum height at every density and on every pointer. A cell's hover fill applies only where the device can hover; touch gets the same fill while pressed.

### Named Rules

**The Joined Cell Rule.** Inside a group, cells touch and share hairlines. Only group panels are separated by a gap.

**The Everything Is Visible Rule.** All links are on the page at rest. The grid never paginates, collapses, or scrolls within a panel.

## Elevation & Depth

Flat. Depth comes from tonal steps (ground, panel, strip) and hairlines. The sticky bar and the settings panel float over content with no shadow at all, separated only by their opaque fill and a border.

`box-shadow` appears only as a way to draw zero-blur lines where a border would break the grid or shift layout.

### Shadow Vocabulary

- **Shared rule** (`box-shadow: 1px 0 0 var(--border), 0 1px 0 var(--border)`): The right and bottom rule of each cell. The panel clips the outer ones, leaving its border as the only outline.
- **Selected ring** (`box-shadow: inset 0 0 0 1px var(--accent)`): A selected segment.
- **Top match ring** (`box-shadow: inset 0 0 0 1px var(--accent-line)`): The cell Enter will open.
- **Logo halo** (`filter: drop-shadow(0 0 1px var(--icon-halo)) drop-shadow(0 0 1px var(--icon-halo-2))`): Image logos only. A legibility aid for third-party artwork, and the only blur in the system.

### Named Rules

**The Hairline Elevation Rule.** No surface casts a shadow. If two layers need separating, use a tonal step or a hairline.

## Shapes

Every corner is square (0px). Outlines are 1px, at two strengths: a mild hairline for structure and a firm one for controls. Icons follow the same geometry, with Lucide strokes at 1.75 set to square caps and miter joins. The missing-icon monogram is a bordered square.

### Named Rules

**The Zero Radius Rule.** Every surface and control the system draws has square corners. Bookmark logos are third-party artwork and keep their own silhouettes.

## Components

Motion across all of these is limited to a 100ms ease-out change of color or background on cells and icon buttons. Nothing moves, and reduced-motion removes transitions entirely. Every control shows a 2px amber focus ring offset by 2px unless noted.

### Buttons

Plain and outlined; no filled variant exists.

- **Shape:** Square with a firm hairline outline (0px, 1px).
- **Text button:** Transparent, ink label, 34px tall with 12px inline padding. Used only for notice recovery actions such as retry and clear filter.
- **Icon button:** Transparent 34px square holding a 17px icon in soft ink.
- **Hover / Focus:** Hover adds the hover tint, and an icon button's icon steps up to ink.

### Chips

Settings choices are segmented radio rows rather than free chips.

- **Style:** Equal-width segments joined inside one firm outline, split by firm hairlines. 30px tall, with an optional 14px icon.
- **State:** Selected takes the amber wash, a 1px amber inset ring, ink text, and weight 600. Hover takes the hover tint.

### Cards / Containers

- **Corner Style:** Square (0px).
- **Background:** Panel, with a strip-toned header when the group has a name. Ungrouped links render as a panel with no header.
- **Shadow Strategy:** None; see Elevation & Depth.
- **Border:** 1px hairline.
- **Internal Padding:** Header 7px by 14px. Notices use 20px with an 8px stack.

### Inputs / Fields

- **Style:** Panel fill with a firm hairline, 34px tall, holding a 16px search icon, the input, and once there is a query, a count and a clear control.
- **Focus:** The whole field's border turns amber and the caret is amber. This replaces the ring on the input.
- **Placeholder:** Faint ink at full opacity.

### Navigation

- **Top bar:** Opaque ground with a bottom hairline, sticky. Left side reads as a short path: a 17px home icon, a faint slash, then the config title in title weight, truncating with an ellipsis when space runs out.
- **Settings panel:** A popover anchored under the bar at the right gutter, 348px wide, on panel fill with a firm hairline. At 640px and below it becomes a full-width bottom sheet with only a top border.

### Bookmark Cell

The signature element. A whole-cell link at a 44px minimum height: a 26px icon (20px at compact), then a name with an optional description.

- **Hover / Pressed:** Hover tint.
- **Focus:** The amber ring sits inside the cell (offset -2px), so joined neighbors never clip it.
- **Top match:** While filtering, the cell Enter will open takes the amber wash, the softer amber ring, and a small outlined Enter hint at its far end. Coarse pointers hide the hint.
- **Icon:** Multicolor logos and single-color masks share a contained box. When a source is missing or fails, a monogram stands in: the name's first letter or digit in weight 600 at half the icon size, in soft ink, in a bordered square.

### Group Header

A strip-toned bar with the group name at left and a count at far right. While filtering, the count reads as shown over total.

### Notice

An inline panel in the content column for the empty, no-match, and load-failure states: a title line, short plain copy, and a text button when there is a recovery action.

## Do's and Don'ts

### Do:

- **Do** define every new color as one `light-dark()` pair, and meet WCAG AA in both themes.
- **Do** use zero radius and a 1px hairline on every new surface and control.
- **Do** keep cells joined inside a group, with shared rules and no gaps.
- **Do** reserve amber for focus, the top match, and selected settings.
- **Do** use Lucide icons at stroke 1.75 with square caps and miter joins.
- **Do** give a monogram fallback to anything that loads an external icon.
- **Do** keep every control at 44px or more on coarse pointers.
- **Do** match the existing 100ms ease-out for color and background transitions, and honor reduced motion.

### Don't:

- **Don't** add a sidebar, stat cards, or a hero header.
- **Don't** round corners on anything the system draws.
- **Don't** add shadows to surfaces. `box-shadow` only draws 1px zero-blur rules and inset rings, and the logo halo is the only blur.
- **Don't** introduce a second typeface or a display or headline size.
- **Don't** use amber for hover, decoration, or emphasis in copy.
- **Don't** tint chrome with a second hue; logos are the only other color.
- **Don't** use tracked uppercase as a decorative line above other text.
- **Don't** animate position, scale, or layout.
