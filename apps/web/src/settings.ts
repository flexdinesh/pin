import { createEffect, createSignal, onCleanup, type Accessor } from 'solid-js'

export type Theme = 'system' | 'light' | 'dark'
export type Columns = 'auto' | 1 | 2 | 3 | 4 | 5 | 6
export type Density = 'comfortable' | 'compact'
export type LinkTarget = 'new' | 'same'

export type Settings = {
  theme: Theme
  columns: Columns
  density: Density
  linkTarget: LinkTarget
  showDescriptions: boolean
}

export const themes: readonly Theme[] = ['system', 'light', 'dark']
export const columnChoices: readonly Columns[] = ['auto', 1, 2, 3, 4, 5, 6]
export const densities: readonly Density[] = ['comfortable', 'compact']
export const linkTargets: readonly LinkTarget[] = ['new', 'same']

export const defaultSettings: Settings = {
  theme: 'system',
  columns: 'auto',
  density: 'comfortable',
  linkTarget: 'new',
  showDescriptions: true,
}

// index.html reads this key before first paint.
export const storageKey = 'pin.settings.v1'

function pick<T>(choices: readonly T[], value: unknown, fallback: T): T {
  return choices.find((choice) => choice === value) ?? fallback
}

// Each field falls back on its own, so one bad value never discards the rest.
export function parseSettings(raw: string | null): Settings {
  if (raw === null) return defaultSettings
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return defaultSettings
  }
  if (typeof value !== 'object' || value === null) return defaultSettings
  const entries = new Map(Object.entries(value))
  const showDescriptions = entries.get('showDescriptions')
  return {
    theme: pick(themes, entries.get('theme'), defaultSettings.theme),
    columns: pick(columnChoices, entries.get('columns'), defaultSettings.columns),
    density: pick(densities, entries.get('density'), defaultSettings.density),
    linkTarget: pick(linkTargets, entries.get('linkTarget'), defaultSettings.linkTarget),
    showDescriptions:
      typeof showDescriptions === 'boolean' ? showDescriptions : defaultSettings.showDescriptions,
  }
}

function read(): Settings {
  try {
    return parseSettings(localStorage.getItem(storageKey))
  } catch {
    return defaultSettings
  }
}

function write(settings: Settings): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify(settings))
  } catch {
    // Settings still apply for this page when storage is unavailable.
  }
}

const themeColors = { light: '#ffffff', dark: '#06070b' }

// An installed app's title bar follows these, so an explicit theme has to override both.
function applyThemeColor(theme: Theme): void {
  const set = (scheme: keyof typeof themeColors) =>
    document
      .querySelector(`meta[name="theme-color"][media*="${scheme}"]`)
      ?.setAttribute('content', themeColors[theme === 'system' ? scheme : theme])
  set('light')
  set('dark')
}

function applyToDocument(settings: Settings): void {
  const root = document.documentElement
  if (settings.theme === 'system') delete root.dataset.theme
  else root.dataset.theme = settings.theme
  applyThemeColor(settings.theme)

  root.dataset.density = settings.density

  if (settings.columns === 'auto') {
    delete root.dataset.columns
    root.style.removeProperty('--columns')
  } else {
    root.dataset.columns = ''
    root.style.setProperty('--columns', String(settings.columns))
  }
}

export type SettingsStore = {
  settings: Accessor<Settings>
  update: (patch: Partial<Settings>) => void
  // True when running as an installed app, where links always leave the app window.
  installed: boolean
  linkTarget: Accessor<LinkTarget>
}

export function createSettings(): SettingsStore {
  const [settings, setSettings] = createSignal(read())
  const installed = window.matchMedia('(display-mode: standalone)').matches

  createEffect(() => applyToDocument(settings()))

  const onStorage = (event: StorageEvent) => {
    if (event.key === storageKey) setSettings(parseSettings(event.newValue))
  }
  window.addEventListener('storage', onStorage)
  onCleanup(() => window.removeEventListener('storage', onStorage))

  return {
    settings,
    update: (patch) => {
      const next = { ...settings(), ...patch }
      setSettings(next)
      write(next)
    },
    installed,
    linkTarget: () => (installed ? 'new' : settings().linkTarget),
  }
}
