import { cleanup } from '@solidjs/testing-library'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
  localStorage.clear()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.density
  delete document.documentElement.dataset.columns
})
