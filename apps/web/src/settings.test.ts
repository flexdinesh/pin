import { createRoot } from 'solid-js'
import { describe, expect, it } from 'vitest'
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
})
