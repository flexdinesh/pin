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

afterEach(() => {
  cleanup()
  localStorage.clear()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.density
  delete document.documentElement.dataset.columns
})
