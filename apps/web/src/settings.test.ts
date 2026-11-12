import { createRoot } from 'solid-js'
import { describe, expect, it, vi } from 'vitest'
import { createSettings, defaultSettings, parseSettings, storageKey } from './settings'

describe('parseSettings', () => {
  it('uses defaults when nothing is stored', () => {
    expect(parseSettings(null)).toEqual(defaultSettings)
  })

  it.each(['not json', '42', 'null', '"x"'])('uses defaults for corrupt value %s', (raw) => {
    expect(parseSettings(raw)).toEqual(defaultSettings)
  })

  it('keeps valid fields and replaces invalid ones', () => {
    const raw = JSON.stringify({ theme: 'dark', columns: 9, density: 'x', showDescriptions: false })
    expect(parseSettings(raw)).toEqual({
      ...defaultSettings,
      theme: 'dark',
      showDescriptions: false,
    })
  })
})

const withStore = (run: (store: ReturnType<typeof createSettings>) => void) =>
  createRoot((dispose) => {
    run(createSettings())
    dispose()
  })

const colors = () =>
  [...document.querySelectorAll('meta[name="theme-color"]')].map((meta) =>
    meta.getAttribute('content'),
  )

describe('createSettings', () => {
  it('persists updates and restores them', () => {
    withStore((store) => store.update({ theme: 'light', columns: 3 }))
    expect(JSON.parse(localStorage.getItem(storageKey) ?? '{}')).toMatchObject({
      theme: 'light',
      columns: 3,
    })
    withStore((store) => {
      expect(store.settings().theme).toBe('light')
      expect(store.settings().columns).toBe(3)
    })
  })

  it('follows changes from another tab', () => {
    withStore((store) => {
      window.dispatchEvent(
        new StorageEvent('storage', {
          key: storageKey,
          newValue: JSON.stringify({ density: 'compact' }),
        }),
      )
      expect(store.settings().density).toBe('compact')
    })
  })

  it('ignores storage events for other keys', () => {
    withStore((store) => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: '{}' }))
      expect(store.settings()).toEqual(defaultSettings)
    })
  })

  it('makes the browser theme color follow an explicit theme', () => {
    document.head.innerHTML = `
      <meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
      <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#21252b" />`
    const { store, dispose } = createRoot((disposeRoot) => ({
      store: createSettings(),
      dispose: disposeRoot,
    }))

    store.update({ theme: 'dark' })
    expect(colors()).toEqual(['#21252b', '#21252b'])
    store.update({ theme: 'light' })
    expect(colors()).toEqual(['#ffffff', '#ffffff'])
    store.update({ theme: 'system' })
    expect(colors()).toEqual(['#ffffff', '#21252b'])

    dispose()
    document.head.innerHTML = ''
  })
})

describe('link target', () => {
  it('uses the setting in a browser tab', () => {
    withStore((store) => {
      store.update({ linkTarget: 'same' })
      expect(store.installed).toBe(false)
      expect(store.linkTarget()).toBe('same')
    })
  })

  it('always opens new in an installed app, without changing the stored setting', () => {
    localStorage.setItem(storageKey, JSON.stringify({ linkTarget: 'same' }))
    const browserTab = window.matchMedia
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      ...browserTab(query),
      matches: query === '(display-mode: standalone)',
    }))
    withStore((store) => {
      expect(store.installed).toBe(true)
      expect(store.linkTarget()).toBe('new')
      expect(store.settings().linkTarget).toBe('same')
    })
    vi.restoreAllMocks()
  })
})
