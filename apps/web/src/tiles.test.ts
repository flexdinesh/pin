import { afterEach, describe, expect, it, vi } from 'vitest'
import indexHtml from '../index.html?raw'
import { fitTiles, keepTilesFitted } from './tiles'

// jsdom has no layout: each tile reports the content width given here, and only while
// fitTiles has the list in its measuring state, as a browser's max-content layout would.
function tileList(lanes: string, contentWidths: number[]) {
  const list = document.createElement('ul')
  list.style.gridTemplateColumns = lanes
  for (const index of contentWidths.keys()) {
    const tile = document.createElement('li')
    vi.spyOn(tile, 'getBoundingClientRect').mockImplementation(() =>
      DOMRect.fromRect({ width: 'measuring' in list.dataset ? contentWidths[index] : 0 }),
    )
    list.append(tile)
  }
  return list
}

const wideTiles = (list: HTMLElement) =>
  Array.from(list.children, (tile) => tile.hasAttribute('data-wide'))

function observedList() {
  const callbacks: ResizeObserverCallback[] = []
  const disconnect = vi.fn()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(callback: ResizeObserverCallback) {
        callbacks.push(callback)
      }
      observe() {}
      unobserve() {}
      disconnect = disconnect
    },
  )
  const list = tileList('200px 200px', [260])
  let clientWidth = 408
  vi.spyOn(list, 'clientWidth', 'get').mockImplementation(() => clientWidth)
  const observer = new ResizeObserver(() => undefined)
  const resize = (width: number) => {
    clientWidth = width
    for (const callback of callbacks) callback([], observer)
  }
  return { list, resize, disconnect }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fitTiles', () => {
  it('widens only the tiles whose content does not fit a lane', () => {
    const list = tileList('200px 200px 200px', [120, 200, 260])
    fitTiles(list)
    expect(wideTiles(list)).toEqual([false, false, true])
  })

  it('leaves no measuring state behind', () => {
    const list = tileList('200px 200px', [120])
    fitTiles(list)
    expect('measuring' in list.dataset).toBe(false)
  })

  it('never widens in a single lane', () => {
    const list = tileList('200px', [260])
    fitTiles(list)
    expect(wideTiles(list)).toEqual([false])
  })

  it('narrows a tile again once its content fits a lane', () => {
    const contentWidths = [260]
    const list = tileList('200px 200px', contentWidths)
    fitTiles(list)
    expect(wideTiles(list)).toEqual([true])
    contentWidths[0] = 120
    fitTiles(list)
    expect(wideTiles(list)).toEqual([false])
  })
})

describe('keepTilesFitted', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fits again when the width changes, not when only the height does', () => {
    const { list, resize } = observedList()
    const stop = keepTilesFitted(list)

    resize(408)
    expect(wideTiles(list)).toEqual([false])

    resize(300)
    expect(wideTiles(list)).toEqual([true])
    stop()
  })

  it('fits again when fonts load, until stopped', () => {
    const { list, disconnect } = observedList()
    const stop = keepTilesFitted(list)

    document.fonts.dispatchEvent(new Event('loadingdone'))
    expect(wideTiles(list)).toEqual([true])

    stop()
    expect(disconnect).toHaveBeenCalled()
    list.children[0]?.removeAttribute('data-wide')
    document.fonts.dispatchEvent(new Event('loadingdone'))
    expect(wideTiles(list)).toEqual([false])
  })
})

describe('referrer policy', () => {
  it('sends no referrer from the page', () => {
    const page = new DOMParser().parseFromString(indexHtml, 'text/html')
    expect(page.querySelector('meta[name="referrer"]')?.getAttribute('content')).toBe('no-referrer')
  })
})
