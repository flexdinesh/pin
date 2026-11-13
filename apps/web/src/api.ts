export type Icon = { kind: 'image' | 'mask'; src: string; color?: string }

export type Label = { name: string; color?: string }

export type Widget = { id: string; type: 'gatus' }

export type WidgetStatus = { up: number; down: number }

export type Bookmark = {
  name: string
  url: string
  description?: string
  icon?: Icon
  noHalo?: boolean
  label?: Label
  widget?: Widget
}

export type Group = { name: string; bookmarks: Bookmark[] }

export type Config = { title: string; groups: Group[] }

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

function parseIcon(value: unknown): Icon | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value) || typeof value.src !== 'string') throw new Error('invalid icon')
  if (value.kind !== 'image' && value.kind !== 'mask') throw new Error('invalid icon kind')
  const icon: Icon = { kind: value.kind, src: value.src }
  if (typeof value.color === 'string') icon.color = value.color
  return icon
}

function parseLabel(value: unknown): Label | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value) || typeof value.name !== 'string') throw new Error('invalid label')
  const label: Label = { name: value.name }
  if (typeof value.color === 'string') label.color = value.color
  return label
}

function parseWidget(value: unknown): Widget | undefined {
  if (value === undefined) return undefined
  if (!isRecord(value) || typeof value.id !== 'string') throw new Error('invalid widget')
  if (value.type !== 'gatus') throw new Error('invalid widget type')
  return { id: value.id, type: value.type }
}

function parseBookmark(value: unknown): Bookmark {
  if (!isRecord(value) || typeof value.name !== 'string' || typeof value.url !== 'string') {
    throw new Error('invalid bookmark')
  }
  const bookmark: Bookmark = { name: value.name, url: value.url }
  if (typeof value.description === 'string') bookmark.description = value.description
  const icon = parseIcon(value.icon)
  if (icon) bookmark.icon = icon
  if (value.noHalo === true) bookmark.noHalo = true
  const label = parseLabel(value.label)
  if (label) bookmark.label = label
  const widget = parseWidget(value.widget)
  if (widget) bookmark.widget = widget
  return bookmark
}

function parseGroup(value: unknown): Group {
  if (!isRecord(value) || typeof value.name !== 'string' || !Array.isArray(value.bookmarks)) {
    throw new Error('invalid group')
  }
  const bookmarks: unknown[] = value.bookmarks
  return { name: value.name, bookmarks: bookmarks.map(parseBookmark) }
}

export function parseConfig(value: unknown): Config {
  if (!isRecord(value) || typeof value.title !== 'string' || !Array.isArray(value.groups)) {
    throw new Error('invalid config')
  }
  const groups: unknown[] = value.groups
  return { title: value.title, groups: groups.map(parseGroup) }
}

export async function fetchConfig(): Promise<Config> {
  // Relative to the page, so pin works under a base path.
  const response = await fetch('api/config')
  if (!response.ok) throw new Error(`config request failed: ${response.status}`)
  const body: unknown = await response.json()
  return parseConfig(body)
}

export function parseWidgetStatus(value: unknown): WidgetStatus {
  if (!isRecord(value) || typeof value.up !== 'number' || typeof value.down !== 'number') {
    throw new Error('invalid widget status')
  }
  return { up: value.up, down: value.down }
}

export async function fetchWidgetStatus(id: string, signal: AbortSignal): Promise<WidgetStatus> {
  const response = await fetch(`api/widgets/${encodeURIComponent(id)}`, { signal })
  if (!response.ok) throw new Error(`widget request failed: ${response.status}`)
  const body: unknown = await response.json()
  return parseWidgetStatus(body)
}
