export type Icon = { kind: 'image' | 'mask'; src: string; color?: string }

export type Bookmark = { name: string; url: string; description?: string; icon?: Icon }

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

function parseBookmark(value: unknown): Bookmark {
  if (!isRecord(value) || typeof value.name !== 'string' || typeof value.url !== 'string') {
    throw new Error('invalid bookmark')
  }
  const bookmark: Bookmark = { name: value.name, url: value.url }
  if (typeof value.description === 'string') bookmark.description = value.description
  const icon = parseIcon(value.icon)
  if (icon) bookmark.icon = icon
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
  const response = await fetch('/api/config')
  if (!response.ok) throw new Error(`config request failed: ${response.status}`)
  const body: unknown = await response.json()
  return parseConfig(body)
}
