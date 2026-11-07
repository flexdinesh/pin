import { describe, expect, it } from 'vitest'
import { parseConfig, parseWidgetStatus } from './api'

describe('parseConfig', () => {
  it('accepts a full server response', () => {
    const value = {
      title: 'Lab',
      groups: [
        {
          name: 'G',
          bookmarks: [
            {
              name: 'A',
              url: 'https://a.test',
              description: 'd',
              icon: { kind: 'mask', src: 'https://i.test/a.svg', color: '#112233' },
              label: { name: 'vpn', color: '#0ea5e9' },
            },
            { name: 'B', url: 'https://b.test', label: { name: 'beta' } },
            { name: 'C', url: 'https://c.test' },
            { name: 'D', url: 'https://d.test', widget: { id: '0', type: 'gatus' } },
          ],
        },
      ],
    }
    expect(parseConfig(value)).toEqual(value)
  })

  it.each([
    ['null', null],
    ['missing groups', { title: 'x' }],
    ['non-array groups', { title: 'x', groups: {} }],
    ['bookmark without url', { title: 'x', groups: [{ name: 'g', bookmarks: [{ name: 'a' }] }] }],
    [
      'unknown icon kind',
      {
        title: 'x',
        groups: [
          {
            name: 'g',
            bookmarks: [{ name: 'a', url: 'https://a.test', icon: { kind: 'x', src: 'y' } }],
          },
        ],
      },
    ],
    [
      'label without a name',
      {
        title: 'x',
        groups: [
          {
            name: 'g',
            bookmarks: [{ name: 'a', url: 'https://a.test', label: { color: '#112233' } }],
          },
        ],
      },
    ],
    [
      'unknown widget type',
      {
        title: 'x',
        groups: [
          {
            name: 'g',
            bookmarks: [{ name: 'a', url: 'https://a.test', widget: { id: '0', type: 'nope' } }],
          },
        ],
      },
    ],
    [
      'widget without an id',
      {
        title: 'x',
        groups: [
          {
            name: 'g',
            bookmarks: [{ name: 'a', url: 'https://a.test', widget: { type: 'gatus' } }],
          },
        ],
      },
    ],
  ])('rejects %s', (_label, value) => {
    expect(() => parseConfig(value)).toThrow()
  })
})

describe('parseWidgetStatus', () => {
  it('accepts counts', () => {
    expect(parseWidgetStatus({ up: 12, down: 0 })).toEqual({ up: 12, down: 0 })
  })

  it.each([
    ['null', null],
    ['missing down', { up: 1 }],
    ['text counts', { up: '1', down: '0' }],
  ])('rejects %s', (_label, value) => {
    expect(() => parseWidgetStatus(value)).toThrow()
  })
})
