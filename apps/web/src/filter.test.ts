import { describe, expect, it } from 'vitest'
import type { Group } from './api'
import { filterGroups, topMatch } from './filter'

const groups: Group[] = [
  {
    name: 'Infrastructure',
    bookmarks: [
      { name: 'Grafana', url: 'https://g.test', description: 'Metrics and dashboards' },
      { name: 'Longhorn', url: 'https://l.test', description: 'Cluster storage' },
    ],
  },
  { name: 'Development', bookmarks: [{ name: 'Registry', url: 'https://r.test' }] },
]

const names = (result: Group[]) => result.flatMap((g) => g.bookmarks.map((b) => b.name))

describe('topMatch', () => {
  const ranked: Group[] = [
    {
      name: 'Production',
      bookmarks: [
        { name: 'FreshRSS', url: 'https://f.test' },
        { name: 'Reprox', url: 'https://r.test' },
        { name: 'Proxmox', url: 'https://p.test' },
      ],
    },
  ]
  const top = (query: string) => topMatch(filterGroups(ranked, query), query)?.name

  it('prefers a name prefix over a substring and a group match', () => {
    expect(top('pro')).toBe('Proxmox')
  })

  it('prefers a name substring over a group match', () => {
    expect(top('prox')).toBe('Proxmox')
    expect(top('epro')).toBe('Reprox')
  })

  it('falls back to grid order', () => {
    expect(top('production')).toBe('FreshRSS')
  })

  it('has no top match without results', () => {
    expect(top('zzz')).toBeUndefined()
  })
})

describe('filterGroups', () => {
  it('returns everything for a blank query', () => {
    expect(filterGroups(groups, '  ')).toBe(groups)
  })

  it('matches name case-insensitively', () => {
    expect(names(filterGroups(groups, 'GRAF'))).toEqual(['Grafana'])
  })

  it('matches description', () => {
    expect(names(filterGroups(groups, 'storage'))).toEqual(['Longhorn'])
  })

  it('matches group name', () => {
    expect(names(filterGroups(groups, 'develop'))).toEqual(['Registry'])
  })

  it('requires every term, across fields', () => {
    expect(names(filterGroups(groups, 'infra metrics'))).toEqual(['Grafana'])
    expect(names(filterGroups(groups, 'infra registry'))).toEqual([])
  })

  it('drops groups without a match and keeps order', () => {
    expect(filterGroups(groups, 'r').map((g) => g.name)).toEqual(['Infrastructure', 'Development'])
    expect(filterGroups(groups, 'registry').map((g) => g.name)).toEqual(['Development'])
  })
})
