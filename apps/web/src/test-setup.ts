import { cleanup } from '@solidjs/testing-library'
import { afterEach } from 'vitest'

// jsdom has no matchMedia. Tests read as a normal browser tab unless they override it.
window.matchMedia = (media) => ({
  matches: false,
  media,
  onchange: null,
  addListener: () => undefined,
  removeListener: () => undefined,
  addEventListener: () => undefined,
  removeEventListener: () => undefined,
  dispatchEvent: () => false,
})

// jsdom has no layout, so nothing resizes and no font loads. Tile fitting tests drive these.
window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(document, 'fonts', { configurable: true, value: new EventTarget() })

afterEach(() => {
  cleanup()
  localStorage.clear()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.density
  delete document.documentElement.dataset.columns
})
