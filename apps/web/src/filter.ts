import type { Bookmark, Group } from './api'

// Every whitespace-separated term must appear in the bookmark's name,
// description or group. Groups left without a match are dropped.
export function filterGroups(groups: Group[], query: string): Group[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (terms.length === 0) return groups

  return groups
    .map((group) => ({
      name: group.name,
      bookmarks: group.bookmarks.filter((bookmark) => {
        const text = `${bookmark.name} ${bookmark.description ?? ''} ${group.name}`.toLowerCase()
        return terms.every((term) => text.includes(term))
      }),
    }))
    .filter((group) => group.bookmarks.length > 0)
}

// The bookmark Enter opens: name prefix beats name substring beats any other
// match, so `pro` finds Proxmox rather than the first link in a group named
// Production. Ties keep grid order.
export function topMatch(groups: Group[], query: string): Bookmark | undefined {
  const needle = query.trim().toLowerCase()
  const bookmarks = groups.flatMap((group) => group.bookmarks)
  return (
    bookmarks.find((bookmark) => bookmark.name.toLowerCase().startsWith(needle)) ??
    bookmarks.find((bookmark) => bookmark.name.toLowerCase().includes(needle)) ??
    bookmarks[0]
  )
}
