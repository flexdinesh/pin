import { afterEach, describe, expect, it, vi } from 'vitest'
import indexHtml from '../index.html?raw'
import { fitTiles, flowRows, keepTilesFitted, packTiles, phoneQuery, stackTiles } from './tiles'

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

// Reports the phone breakpoint as matching or not, and lets a test flip it.
function stubPhone(matches: boolean) {
  const listeners: (() => void)[] = []
  const query = {
    matches,
    addEventListener: (_type: string, listener: () => void) => listeners.push(listener),
    removeEventListener: (_type: string, listener: () => void) =>
      listeners.splice(listeners.indexOf(listener), 1),
  }
  const original = window.matchMedia
  vi.spyOn(window, 'matchMedia').mockImplementation((media) =>
    media === phoneQuery ? Object.assign(original(media), query) : original(media),
  )
  return {
    flip: (next: boolean) => {
      query.matches = next
      for (const listener of listeners) listener()
    },
    listeners,
  }
}

function observedList() {
  const phone = stubPhone(true)
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
  return { list, resize, disconnect, phone }
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
    const stop = keepTilesFitted(list, () => Infinity)

    resize(408)
    expect(wideTiles(list)).toEqual([false])

    resize(300)
    expect(wideTiles(list)).toEqual([true])
    stop()
  })

  it('fits again when fonts load, until stopped', () => {
    const { list, disconnect } = observedList()
    const stop = keepTilesFitted(list, () => Infinity)

    document.fonts.dispatchEvent(new Event('loadingdone'))
    expect(wideTiles(list)).toEqual([true])

    stop()
    expect(disconnect).toHaveBeenCalled()
    list.children[0]?.removeAttribute('data-wide')
    document.fonts.dispatchEvent(new Event('loadingdone'))
    expect(wideTiles(list)).toEqual([false])
  })

  it('packs or fits again when the phone breakpoint flips, until stopped', () => {
    const { list, phone } = observedList()
    const stop = keepTilesFitted(list, () => Infinity)

    phone.flip(false)
    expect('packed' in list.dataset).toBe(true)

    phone.flip(true)
    expect('packed' in list.dataset).toBe(false)
    expect(wideTiles(list)).toEqual([true])

    stop()
    expect(phone.listeners).toHaveLength(0)
  })
})

describe('flowRows', () => {
  it('stretches a full row in proportion to content and leaves the last row natural', () => {
    expect(flowRows([100, 300, 150], 500, 0, Infinity)).toEqual([
      { x: 0, width: 125 },
      { x: 125, width: 375 },
      { x: 0, width: 150 },
    ])
  })

  it('counts the gap between tiles when filling and stretching a row', () => {
    expect(flowRows([100, 100, 100], 300, 8, Infinity)).toEqual([
      { x: 0, width: 146 },
      { x: 154, width: 146 },
      { x: 0, width: 100 },
    ])
  })

  it('wraps at the row cap, and a row that reaches the cap is full', () => {
    expect(flowRows([100, 100, 100, 100], 1000, 0, 2)).toEqual([
      { x: 0, width: 500 },
      { x: 500, width: 500 },
      { x: 0, width: 500 },
      { x: 500, width: 500 },
    ])
  })

  it('gives each tile the full width with one tile per row', () => {
    expect(flowRows([100, 120], 300, 8, 1)).toEqual([
      { x: 0, width: 300 },
      { x: 0, width: 300 },
    ])
  })

  it('narrows a tile wider than the list to the list', () => {
    expect(flowRows([500], 300, 8, Infinity)).toEqual([{ x: 0, width: 300 }])
  })
})

describe('stackTiles', () => {
  it('raises a tile to the lowest tile it overlaps, so rows interlock', () => {
    const boxes = [
      { x: 0, width: 100, height: 40 },
      { x: 108, width: 100, height: 80 },
      { x: 0, width: 100, height: 40 },
      { x: 108, width: 100, height: 40 },
    ]
    expect(stackTiles(boxes, 8)).toEqual({ tops: [0, 0, 48, 88], height: 128 })
  })

  it('ignores neighbours that only touch at an edge', () => {
    const boxes = [
      { x: 0, width: 100, height: 40 },
      { x: 100, width: 100, height: 40 },
    ]
    expect(stackTiles(boxes, 8)).toEqual({ tops: [0, 0], height: 40 })
  })
})

// Tiles report their content width while measured, then the width set on them and the
// height given here, as a browser would.
function packedList(contentWidths: number[], heights: number[], width: number) {
  const list = document.createElement('ul')
  list.style.columnGap = '8px'
  vi.spyOn(list, 'clientWidth', 'get').mockReturnValue(width)
  for (const index of contentWidths.keys()) {
    const tile = document.createElement('li')
    tile.setAttribute('data-wide', '')
    vi.spyOn(tile, 'getBoundingClientRect').mockImplementation(() =>
      'measuring' in list.dataset
        ? DOMRect.fromRect({ width: contentWidths[index] })
        : DOMRect.fromRect({
            width: Number.parseFloat(tile.style.getPropertyValue('--w')),
            height: heights[index],
          }),
    )
    list.append(tile)
  }
  return list
}

const placement = (list: HTMLElement) =>
  Array.from(list.children, (tile) =>
    tile instanceof HTMLElement
      ? ['--x', '--y', '--w'].map((name) => tile.style.getPropertyValue(name))
      : [],
  )

describe('packTiles', () => {
  it('sizes tiles to content, stretches full rows and stacks the next row', () => {
    stubPhone(false)
    const list = packedList([100, 100, 250], [40, 60, 40], 300)
    packTiles(list, Infinity)

    expect('packed' in list.dataset).toBe(true)
    expect(wideTiles(list)).toEqual([false, false, false])
    expect(placement(list)).toEqual([
      ['0px', '0px', '146px'],
      ['154px', '0px', '146px'],
      ['0px', '68px', '250px'],
    ])
    expect(list.style.getPropertyValue('--packed-height')).toBe('108px')
  })

  it('keeps lanes on a phone', () => {
    stubPhone(true)
    const list = tileList('200px 200px', [260])
    list.dataset.packed = ''
    packTiles(list, Infinity)

    expect('packed' in list.dataset).toBe(false)
    expect(wideTiles(list)).toEqual([true])
  })
})

describe('referrer policy', () => {
  it('sends no referrer from the page', () => {
    const page = new DOMParser().parseFromString(indexHtml, 'text/html')
    expect(page.querySelector('meta[name="referrer"]')?.getAttribute('content')).toBe('no-referrer')
  })
})
