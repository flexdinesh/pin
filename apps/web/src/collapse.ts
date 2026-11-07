import { createSignal, onCleanup } from 'solid-js'

export const collapseStorageKey = 'pin.collapsed.v1'

export function parseCollapsed(raw: string | null): ReadonlySet<string> {
  if (raw === null) return new Set()
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return new Set()
  }
  if (!Array.isArray(value)) return new Set()
  const names: unknown[] = value
  // The ungrouped set has an empty name and no title bar to reopen it from.
  return new Set(names.filter((name) => typeof name === 'string' && name !== '').map(String))
}

function read(): ReadonlySet<string> {
  try {
    return parseCollapsed(localStorage.getItem(collapseStorageKey))
  } catch {
    return new Set()
  }
}

function write(collapsed: ReadonlySet<string>): void {
  try {
    localStorage.setItem(collapseStorageKey, JSON.stringify([...collapsed]))
  } catch {
    // Collapsing still applies for this page when storage is unavailable.
  }
}

export type CollapseStore = {
  isCollapsed: (group: string) => boolean
  toggle: (group: string) => void
}

export function createCollapse(): CollapseStore {
  const [collapsed, setCollapsed] = createSignal(read())

  const onStorage = (event: StorageEvent) => {
    if (event.key === collapseStorageKey) setCollapsed(parseCollapsed(event.newValue))
  }
  window.addEventListener('storage', onStorage)
  onCleanup(() => window.removeEventListener('storage', onStorage))

  return {
    isCollapsed: (group) => collapsed().has(group),
    toggle: (group) => {
      const next = new Set(collapsed())
      if (!next.delete(group)) next.add(group)
      setCollapsed(next)
      write(next)
    },
  }
}
