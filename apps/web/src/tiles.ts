// A tile takes one lane, or two when its content does not fit one. Width depends on
// the rendered text, so this measures it and leaves placement to CSS grid.
export function fitTiles(list: HTMLElement): void {
  const tracks = getComputedStyle(list).gridTemplateColumns.split(' ')
  const lane = Number.parseFloat(tracks[0] ?? '')

  // styles.css lays tiles out at their content width while this is set.
  list.dataset.measuring = ''
  const measured = Array.from(list.children, (tile) => ({
    tile,
    width: tile.getBoundingClientRect().width,
  }))
  delete list.dataset.measuring

  for (const { tile, width } of measured) {
    tile.toggleAttribute('data-wide', tracks.length > 1 && width > lane + 0.5)
  }
}

// Fits again when the lanes or the text metrics change. Returns the cleanup.
export function keepTilesFitted(list: HTMLElement): () => void {
  let width = list.clientWidth
  const observer = new ResizeObserver(() => {
    // Fitting changes the list's height, which must not fit it again.
    if (list.clientWidth === width) return
    width = list.clientWidth
    fitTiles(list)
  })
  observer.observe(list)

  const onFontsLoaded = () => fitTiles(list)
  document.fonts.addEventListener('loadingdone', onFontsLoaded)

  return () => {
    observer.disconnect()
    document.fonts.removeEventListener('loadingdone', onFontsLoaded)
  }
}
