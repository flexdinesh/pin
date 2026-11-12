// Phones keep equal lanes. Wider screens size each tile to its content.
export const phoneQuery = '(max-width: 640px)'

export type RowBox = { x: number; width: number }
export type StackBox = RowBox & { height: number }

// Fills rows in order with tiles at their content width. A row is full once the next
// tile does not fit or it holds maxPerRow tiles, and a full row's tiles widen in
// proportion to their content until the row reaches both edges. A last row that is
// not full keeps its content widths.
export function flowRows(
  contentWidths: readonly number[],
  available: number,
  gap: number,
  maxPerRow: number,
): RowBox[] {
  const widths = contentWidths.map((width) => Math.min(width, available))
  const rows: number[][] = []
  let row: number[] = []
  let used = 0
  for (const [index, width] of widths.entries()) {
    const needed = row.length === 0 ? width : used + gap + width
    if (row.length > 0 && (needed > available + 0.5 || row.length >= maxPerRow)) {
      rows.push(row)
      row = [index]
      used = width
    } else {
      row.push(index)
      used = needed
    }
  }
  if (row.length > 0) rows.push(row)

  const boxes: RowBox[] = []
  for (const [rowIndex, indexes] of rows.entries()) {
    const rowWidths = indexes.map((index) => widths[index] ?? 0)
    const content = rowWidths.reduce((total, width) => total + width, 0)
    const leftover = available - content - gap * (indexes.length - 1)
    const full = rowIndex < rows.length - 1 || indexes.length >= maxPerRow
    let x = 0
    for (const width of rowWidths) {
      const grown = full && content > 0 ? width + leftover * (width / content) : width
      boxes.push({ x, width: grown })
      x += grown + gap
    }
  }
  return boxes
}

const overlaps = (a: RowBox, b: RowBox) =>
  Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x) > 0.5

// Each tile rises until it meets an earlier tile it overlaps, so rows interlock.
export function stackTiles(
  boxes: readonly StackBox[],
  gap: number,
): { tops: number[]; height: number } {
  const tops: number[] = []
  let height = 0
  for (const [index, box] of boxes.entries()) {
    let top = 0
    for (const [above, earlier] of boxes.slice(0, index).entries()) {
      if (overlaps(box, earlier)) top = Math.max(top, (tops[above] ?? 0) + earlier.height + gap)
    }
    tops.push(top)
    height = Math.max(height, top + box.height)
  }
  return { tops, height }
}

// Tiles report their content width only while this is set, through styles.css.
function measure(list: HTMLElement): number[] {
  list.dataset.measuring = ''
  const widths = Array.from(list.children, (tile) => tile.getBoundingClientRect().width)
  delete list.dataset.measuring
  return widths
}

// A tile takes one lane, or two when its content does not fit one. Width depends on
// the rendered text, so this measures it and leaves placement to CSS grid.
export function fitTiles(list: HTMLElement): void {
  const tracks = getComputedStyle(list).gridTemplateColumns.split(' ')
  const lane = Number.parseFloat(tracks[0] ?? '')
  const widths = measure(list)
  for (const [index, tile] of Array.from(list.children).entries()) {
    tile.toggleAttribute('data-wide', tracks.length > 1 && (widths[index] ?? 0) > lane + 0.5)
  }
}

// Sizes every tile to its content and places it, or fits lanes on a phone.
export function packTiles(list: HTMLElement, maxPerRow: number): void {
  // Lanes and measuring both need the list out of its packed layout.
  delete list.dataset.packed
  if (window.matchMedia(phoneQuery).matches) {
    fitTiles(list)
    return
  }

  const tiles = Array.from(list.children).filter((tile) => tile instanceof HTMLElement)
  const gap = Number.parseFloat(getComputedStyle(list).columnGap) || 0
  const rows = flowRows(measure(list), list.clientWidth, gap, maxPerRow)
  for (const [index, tile] of tiles.entries()) {
    tile.removeAttribute('data-wide')
    tile.style.setProperty('--w', `${rows[index]?.width ?? 0}px`)
  }

  // Heights depend on the widths just set.
  list.dataset.packed = ''
  const boxes = tiles.map((tile, index) => ({
    x: rows[index]?.x ?? 0,
    width: rows[index]?.width ?? 0,
    height: tile.getBoundingClientRect().height,
  }))
  const { tops, height } = stackTiles(boxes, gap)
  for (const [index, tile] of tiles.entries()) {
    tile.style.setProperty('--x', `${boxes[index]?.x ?? 0}px`)
    tile.style.setProperty('--y', `${tops[index] ?? 0}px`)
  }
  list.style.setProperty('--packed-height', `${height}px`)
}

// Packs again when the width, the text metrics or the phone breakpoint change.
// Returns the cleanup.
export function keepTilesFitted(list: HTMLElement, maxPerRow: () => number): () => void {
  const pack = () => packTiles(list, maxPerRow())
  let width = list.clientWidth
  const observer = new ResizeObserver(() => {
    // Packing changes the list's height, which must not pack it again.
    if (list.clientWidth === width) return
    width = list.clientWidth
    pack()
  })
  observer.observe(list)

  document.fonts.addEventListener('loadingdone', pack)
  const phone = window.matchMedia(phoneQuery)
  phone.addEventListener('change', pack)

  return () => {
    observer.disconnect()
    document.fonts.removeEventListener('loadingdone', pack)
    phone.removeEventListener('change', pack)
  }
}
