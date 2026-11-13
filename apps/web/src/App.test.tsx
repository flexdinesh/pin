import { cleanup, fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Config } from './api'
import { App } from './App'

const config: Config = {
  title: 'Lab',
  groups: [
    {
      name: 'Infrastructure',
      bookmarks: [
        { name: 'Grafana', url: 'https://grafana.test/', description: 'Metrics' },
        { name: 'Longhorn', url: 'https://longhorn.test/', description: 'Storage' },
      ],
    },
    { name: 'Development', bookmarks: [{ name: 'Registry', url: 'https://registry.test/' }] },
  ],
}

const respondWith = (body: unknown) => () => Promise.resolve(Response.json(body))

function stubFetch(handler: () => Promise<Response>) {
  const fetchStub = vi.fn(handler)
  vi.stubGlobal('fetch', fetchStub)
  return fetchStub
}

async function renderLoaded() {
  stubFetch(respondWith(config))
  render(() => <App />)
  await screen.findByRole('link', { name: /Grafana/ })
}

const linkNames = () => screen.queryAllByRole('link').map((link) => link.textContent)
const grafanaLink = () => screen.getByRole<HTMLAnchorElement>('link', { name: /Grafana/ })
const filterInput = () => screen.getByRole<HTMLInputElement>('textbox')
const focused = () => document.activeElement
const stopNavigation = (event: MouseEvent) => event.preventDefault()
const gatusLink = () => screen.findByRole('link', { name: /Gatus/ })
const tagOf = (name: RegExp) => screen.getByRole('link', { name }).querySelector('.tag')
const toggle = (name: string) => screen.getByRole('button', { name })

// For configs whose first group starts collapsed, where renderLoaded would never find its link.
async function renderWithInfrastructureFolded() {
  stubFetch(respondWith(config))
  render(() => <App />)
  await screen.findByRole('link', { name: /Registry/ })
}

beforeEach(() => {
  document.title = ''
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('dashboard', () => {
  it('renders groups in order and sets the title', async () => {
    await renderLoaded()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Infrastructure',
      'Development',
    ])
    expect(screen.getByRole('heading', { level: 1, name: 'Lab' })).toBeTruthy()
    expect(document.title).toBe('Lab')
  })

  it('shows an empty state for a config without bookmarks', async () => {
    stubFetch(respondWith({ title: 'pin', groups: [] }))
    render(() => <App />)
    expect(await screen.findByText('No bookmarks yet')).toBeTruthy()
  })

  it('leaves an ungrouped set without a heading', async () => {
    stubFetch(
      respondWith({
        title: 'x',
        groups: [{ name: '', bookmarks: [{ name: 'A', url: 'https://a.test/' }] }],
      }),
    )
    render(() => <App />)
    await screen.findByRole('link', { name: /A/ })
    expect(screen.queryAllByRole('heading', { level: 2 })).toEqual([])
  })

  it('shows an error with a working retry', async () => {
    const fetchStub = stubFetch(() => Promise.reject(new Error('offline')))
    render(() => <App />)
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain("Couldn't load bookmarks")

    fetchStub.mockImplementation(respondWith(config))
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByRole('link', { name: /Grafana/ })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows an error for a malformed response', async () => {
    stubFetch(respondWith({ nope: true }))
    render(() => <App />)
    expect(await screen.findByRole('alert')).toBeTruthy()
  })
})

describe('type to filter', () => {
  it('captures typing from anywhere on the page', async () => {
    await renderLoaded()
    await userEvent.keyboard('long')
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Filter bookmarks' }))
    expect(linkNames().length).toBe(1)
    expect(screen.getByRole('status').textContent).toBe('1 of 3 bookmarks')
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Infrastructure',
    ])
  })

  it('does not capture shortcuts', async () => {
    await renderLoaded()
    fireEvent.keyDown(document.body, { key: 'k', ctrlKey: true })
    fireEvent.keyDown(document.body, { key: 'k', metaKey: true })
    expect(document.activeElement).toBe(document.body)
  })

  it('opens the top match on Enter, using the real link', async () => {
    await renderLoaded()
    const opened: string[] = []
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      opened.push(`${this.href} ${this.target}`)
    })
    await userEvent.keyboard('regis')
    expect(linkNames().length).toBe(1)
    await userEvent.keyboard('{Enter}')
    expect(opened).toEqual(['https://registry.test/ _blank'])
    expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('')
    expect(linkNames().length).toBe(3)
  })

  it('marks a name match on top rather than the first group match', async () => {
    await renderLoaded()
    await userEvent.keyboard('r')
    expect(linkNames().length).toBe(3)
    expect(document.querySelector('[data-top-match]')?.textContent).toContain('Registry')
  })

  it('does nothing on Enter without a match', async () => {
    await renderLoaded()
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
    await userEvent.keyboard('zzz{Enter}')
    expect(click).not.toHaveBeenCalled()
  })

  it('clears on Escape', async () => {
    await renderLoaded()
    await userEvent.keyboard('long{Escape}')
    expect(linkNames().length).toBe(3)
    expect(screen.getByRole<HTMLInputElement>('textbox').value).toBe('')
  })

  it('offers a way out of a filter with no match', async () => {
    await renderLoaded()
    await userEvent.keyboard('zzz')
    expect(screen.getByText(/No bookmarks match/).textContent).toContain('zzz')
    await userEvent.click(screen.getByText('Clear filter'))
    expect(linkNames().length).toBe(3)
  })
})

describe('keyboard path through results', () => {
  it('reaches the first result with one Tab and returns with Shift+Tab', async () => {
    await renderLoaded()
    await userEvent.keyboard('r')
    await userEvent.tab()
    expect(focused()).toBe(grafanaLink())
    await userEvent.tab({ shift: true })
    expect(focused()).toBe(filterInput())
  })

  it('walks results in order', async () => {
    await renderLoaded()
    await userEvent.keyboard('r')
    await userEvent.tab()
    await userEvent.tab()
    expect(focused()?.textContent).toContain('Longhorn')
    await userEvent.tab()
    expect(focused()?.textContent).toContain('Registry')
  })

  // fireEvent has no default focus movement, like Safari and Firefox on macOS skipping links.
  it('moves through results itself where the browser skips links on Tab', async () => {
    await renderLoaded()
    await userEvent.keyboard('r')
    expect(fireEvent.keyDown(filterInput(), { key: 'Tab' })).toBe(false)
    expect(focused()).toBe(grafanaLink())
    fireEvent.keyDown(grafanaLink(), { key: 'Tab' })
    expect(focused()?.textContent).toContain('Longhorn')
    fireEvent.keyDown(focused() ?? document.body, { key: 'Tab', shiftKey: true })
    expect(focused()).toBe(grafanaLink())
    fireEvent.keyDown(grafanaLink(), { key: 'Tab', shiftKey: true })
    expect(focused()).toBe(filterInput())
  })

  it('leaves Tab to the browser past either end of the results', async () => {
    await renderLoaded()
    await userEvent.keyboard('r')
    expect(fireEvent.keyDown(filterInput(), { key: 'Tab', shiftKey: true })).toBe(true)
    const last = screen.getByRole('link', { name: /Registry/ })
    last.focus()
    expect(fireEvent.keyDown(last, { key: 'Tab' })).toBe(true)
    expect(focused()).toBe(last)
  })

  it('leaves Tab to the browser when not filtering', async () => {
    await renderLoaded()
    filterInput().focus()
    expect(fireEvent.keyDown(filterInput(), { key: 'Tab' })).toBe(true)
    expect(focused()).toBe(filterInput())
  })

  it('moves to the recovery action itself when nothing matches', async () => {
    await renderLoaded()
    await userEvent.keyboard('zzz')
    fireEvent.keyDown(filterInput(), { key: 'Tab' })
    expect(focused()).toBe(screen.getByText('Clear filter'))
  })

  it('keeps Settings in the Tab order, before the filter', async () => {
    await renderLoaded()
    await userEvent.keyboard('r')
    await userEvent.tab({ shift: true })
    expect(focused()).toBe(screen.getByRole('button', { name: 'Settings' }))
  })

  it('keeps the clear control clickable but out of the Tab order', async () => {
    await renderLoaded()
    await userEvent.keyboard('r')
    const clearControl = screen.getByRole('button', { name: 'Clear filter' })
    expect(clearControl.tabIndex).toBe(-1)
    await userEvent.click(clearControl)
    expect(filterInput().value).toBe('')
    expect(focused()).toBe(filterInput())
  })

  it('tabs to the recovery action when nothing matches', async () => {
    await renderLoaded()
    await userEvent.keyboard('zzz')
    await userEvent.tab()
    const recovery = screen.getByText('Clear filter')
    expect(focused()).toBe(recovery)
    await userEvent.click(recovery)
    expect(focused()).toBe(filterInput())
  })

  it('opens the focused result on Enter, then clears and returns to the filter', async () => {
    await renderLoaded()
    const opened: string[] = []
    const onClick = (event: MouseEvent) => {
      if (event.target instanceof Element) opened.push(event.target.closest('a')?.href ?? '')
      event.preventDefault()
    }
    document.addEventListener('click', onClick)
    await userEvent.keyboard('r')
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    document.removeEventListener('click', onClick)
    expect(opened).toEqual(['https://longhorn.test/'])
    await waitFor(() => expect(filterInput().value).toBe(''))
    expect(focused()).toBe(filterInput())
  })

  it('keeps the filter after a mouse or modified activation of a result', async () => {
    await renderLoaded()
    document.addEventListener('click', stopNavigation)
    await userEvent.keyboard('gra')
    await userEvent.click(grafanaLink())
    grafanaLink().focus()
    fireEvent.click(grafanaLink(), { detail: 0, ctrlKey: true })
    await new Promise((resolve) => setTimeout(resolve))
    document.removeEventListener('click', stopNavigation)
    expect(filterInput().value).toBe('gra')
  })

  it('returns to the filter on Escape from a result', async () => {
    await renderLoaded()
    await userEvent.keyboard('r')
    await userEvent.tab()
    await userEvent.keyboard('{Escape}')
    expect(filterInput().value).toBe('')
    expect(focused()).toBe(filterInput())
  })

  it('keeps focus in the filter on the first Escape and leaves on the second', async () => {
    await renderLoaded()
    await userEvent.keyboard('r{Escape}')
    expect(focused()).toBe(filterInput())
    await userEvent.keyboard('{Escape}')
    expect(focused()).toBe(document.body)
  })

  it('returns to the filter from a result on typing and Backspace', async () => {
    await renderLoaded()
    await userEvent.keyboard('re')
    await userEvent.tab()
    await userEvent.keyboard('g')
    expect(filterInput().value).toBe('reg')
    await userEvent.tab()
    // user-event applies the deletion to the old target, so only focus is checked here.
    // A browser then deletes from the filter, which focus moved to on keydown.
    await userEvent.keyboard('{Backspace}')
    expect(focused()).toBe(filterInput())
  })

  it('appends to the query after tabbing back through the filter', async () => {
    await renderLoaded()
    await userEvent.keyboard('re')
    await userEvent.tab()
    // Tabbing into a text field selects its contents.
    await userEvent.tab({ shift: true })
    await userEvent.tab()
    await userEvent.keyboard('g')
    expect(filterInput().value).toBe('reg')
  })

  it('does not capture Backspace with no query', async () => {
    await renderLoaded()
    fireEvent.keyDown(document.body, { key: 'Backspace' })
    expect(focused()).toBe(document.body)
  })

  it('announces results through a status that exists before filtering', async () => {
    await renderLoaded()
    const status = screen.getByRole('status')
    expect(status.textContent).toBe('')
    await userEvent.keyboard('zzz')
    expect(screen.getByRole('status')).toBe(status)
    expect(status.textContent).toBe('No matches')
    await userEvent.keyboard('{Escape}')
    expect(status.textContent).toBe('')
  })

  it('describes the keyboard path on the filter', async () => {
    await renderLoaded()
    expect(filterInput().getAttribute('aria-describedby')).toBeTruthy()
    const description = document.getElementById(
      filterInput().getAttribute('aria-describedby') ?? '',
    )
    expect(description?.textContent).toContain('Tab moves to results')
  })
})

describe('labels', () => {
  const labelled: Config = {
    title: 'Lab',
    groups: [
      {
        name: 'Apps',
        bookmarks: [
          { name: 'Gitea', url: 'https://g.test/', label: { name: 'vpn', color: '#0ea5e9' } },
          { name: 'Immich', url: 'https://i.test/', label: { name: 'beta' } },
          { name: 'Notes', url: 'https://n.test/' },
        ],
      },
    ],
  }

  async function renderLabelled() {
    stubFetch(respondWith(labelled))
    render(() => <App />)
    await screen.findByRole('link', { name: /Gitea/ })
  }

  it('shows the name, and a color square only when one is configured', async () => {
    await renderLabelled()
    expect(tagOf(/Gitea/)?.querySelector('.tag-name')?.textContent).toBe('vpn')
    const square = tagOf(/Gitea/)?.querySelector('.tag-color')
    expect(square?.getAttribute('style')).toContain('background-color')
    expect(tagOf(/Immich/)?.querySelector('.tag-name')?.textContent).toBe('beta')
    expect(tagOf(/Immich/)?.querySelector('.tag-color')).toBeNull()
    expect(tagOf(/Notes/)).toBeNull()
  })

  it('names the label in the link for assistive technology', async () => {
    await renderLabelled()
    // jsdom has no layout, so its computed name loses the space a browser keeps.
    expect(screen.getByRole('link', { name: /Gitea.*Label:\s*vpn/ })).toBeTruthy()
  })

  it('filters by label and keeps the tag on the result', async () => {
    await renderLabelled()
    await userEvent.keyboard('vpn')
    expect(linkNames().length).toBe(1)
    expect(tagOf(/Gitea/)?.querySelector('.tag-name')?.textContent).toBe('vpn')
  })

  it('shows both the tag and the Enter hint on a labelled top match', async () => {
    await renderLabelled()
    await userEvent.keyboard('gitea')
    const top = document.querySelector('[data-top-match]')
    expect(top?.querySelector('.tag')).not.toBeNull()
    expect(top?.querySelector('.enter-hint')).not.toBeNull()
  })
})

describe('collapsing groups', () => {
  const collapsedKey = 'pin.collapsed.v1'

  it('starts open and folds a group from its title bar', async () => {
    await renderLoaded()
    expect(toggle('Infrastructure').getAttribute('aria-expanded')).toBe('true')
    await userEvent.click(toggle('Infrastructure'))
    expect(toggle('Infrastructure').getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByRole('link', { name: /Grafana/ })).toBeNull()
    expect(screen.getByRole('link', { name: /Registry/ })).toBeTruthy()
    await userEvent.click(toggle('Infrastructure'))
    expect(grafanaLink()).toBeTruthy()
  })

  it('keeps the count visible while collapsed', async () => {
    await renderLoaded()
    await userEvent.click(toggle('Infrastructure'))
    const section = screen.getByRole('region', { name: 'Infrastructure' })
    expect(section.querySelector('.group-count')?.textContent).toBe('2')
  })

  it('toggles from the keyboard and leaves folded links out of the Tab order', async () => {
    await renderLoaded()
    toggle('Infrastructure').focus()
    await userEvent.keyboard('{Enter}')
    expect(focused()).toBe(toggle('Infrastructure'))
    await userEvent.tab()
    expect(focused()).toBe(toggle('Development'))
  })

  it('survives a reload', async () => {
    await renderLoaded()
    await userEvent.click(toggle('Infrastructure'))
    expect(JSON.parse(localStorage.getItem(collapsedKey) ?? '[]')).toEqual(['Infrastructure'])
    cleanup()
    await renderWithInfrastructureFolded()
    expect(screen.queryByRole('link', { name: /Grafana/ })).toBeNull()
  })

  it('ignores unusable saved state', async () => {
    localStorage.setItem(collapsedKey, '{not json')
    await renderLoaded()
    expect(toggle('Infrastructure').getAttribute('aria-expanded')).toBe('true')
  })

  it('never folds the ungrouped set', async () => {
    localStorage.setItem(collapsedKey, JSON.stringify(['']))
    stubFetch(
      respondWith({
        title: 'x',
        groups: [{ name: '', bookmarks: [{ name: 'Loose', url: 'https://l.test/' }] }],
      }),
    )
    render(() => <App />)
    expect(await screen.findByRole('link', { name: /Loose/ })).toBeTruthy()
    expect(screen.queryAllByRole('button', { name: '' })).toEqual([])
  })

  it('follows a change made in another tab', async () => {
    await renderLoaded()
    fireEvent(
      window,
      new StorageEvent('storage', { key: collapsedKey, newValue: '["Infrastructure"]' }),
    )
    expect(toggle('Infrastructure').getAttribute('aria-expanded')).toBe('false')
  })

  it('opens collapsed groups while filtering, then restores them', async () => {
    localStorage.setItem(collapsedKey, JSON.stringify(['Infrastructure']))
    await renderWithInfrastructureFolded()
    await userEvent.keyboard('graf')
    expect(grafanaLink()).toBeTruthy()
    expect(toggle('Infrastructure').getAttribute('aria-expanded')).toBe('true')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('link', { name: /Grafana/ })).toBeNull()
    expect(toggle('Infrastructure').getAttribute('aria-expanded')).toBe('false')
    expect(JSON.parse(localStorage.getItem(collapsedKey) ?? '[]')).toEqual(['Infrastructure'])
  })

  it('disables toggles while filtering, so Tab from the filter reaches results', async () => {
    await renderLoaded()
    await userEvent.keyboard('r')
    expect(toggle('Infrastructure')).toHaveProperty('disabled', true)
    await userEvent.tab()
    expect(focused()).toBe(grafanaLink())
  })

  it('starts filtering from a focused toggle', async () => {
    await renderLoaded()
    toggle('Infrastructure').focus()
    await userEvent.keyboard('g')
    expect(focused()).toBe(filterInput())
    expect(filterInput().value).toBe('g')
  })
})

const at = (clientY: number) => ({ touches: [{ clientX: 0, clientY }] })
const strip = () => document.querySelector<HTMLElement>('.pull')
const groups = () => screen.getByRole('main')

function installApp() {
  const browserTab = window.matchMedia
  vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
    ...browserTab(query),
    matches: query === '(display-mode: standalone)',
  }))
}

describe('pull to reload', () => {
  it('reveals the strip under the bar as the groups follow the finger', async () => {
    installApp()
    await renderLoaded()
    fireEvent.touchStart(document, at(100))
    fireEvent.touchMove(document, at(160))
    expect(strip()?.textContent).toBe('Pull to reload')
    expect(strip()?.style.height).toBe('30px')
    expect(groups().style.transform).toBe('translateY(30px)')
    fireEvent.touchMove(document, at(300))
    expect(strip()?.textContent).toBe('Release to reload')
    fireEvent.touchEnd(document, { touches: [] })
    expect(strip()?.textContent).toBe('Reloading')
    expect(groups().style.transform).toBe('translateY(64px)')
  })

  it('settles back after a short pull', async () => {
    installApp()
    await renderLoaded()
    fireEvent.touchStart(document, at(100))
    fireEvent.touchMove(document, at(160))
    fireEvent.touchEnd(document, { touches: [] })
    expect(strip()?.textContent).toBe('Pull to reload')
    expect(strip()?.style.height).toBe('0px')
    expect(groups().style.transform).toBe('')
  })

  it('leaves the gesture to the browser in a tab', async () => {
    await renderLoaded()
    fireEvent.touchStart(document, at(100))
    fireEvent.touchMove(document, at(300))
    expect(strip()).toBeNull()
    expect(groups().style.transform).toBe('')
  })
})

describe('settings', () => {
  it('forces new tabs and hides the link setting in an installed app', async () => {
    localStorage.setItem('pin.settings.v1', JSON.stringify({ linkTarget: 'same' }))
    const browserTab = window.matchMedia
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
      ...browserTab(query),
      matches: query === '(display-mode: standalone)',
    }))
    await renderLoaded()
    expect(grafanaLink().target).toBe('_blank')
    expect(grafanaLink().rel).toBe('noopener')
    expect(screen.queryByRole('radio', { name: 'Same tab', hidden: true })).toBeNull()
  })

  it('opens links in a new tab by default and the same tab when chosen', async () => {
    await renderLoaded()
    expect(grafanaLink().target).toBe('_blank')
    await userEvent.click(screen.getByRole('radio', { name: 'Same tab', hidden: true }))
    expect(grafanaLink().target).toBe('')
  })

  it('hides descriptions but still filters by them', async () => {
    await renderLoaded()
    expect(screen.queryByText('Metrics')).not.toBeNull()
    await userEvent.click(screen.getByRole('radio', { name: 'Hide', hidden: true }))
    await waitFor(() => expect(screen.queryByText('Metrics')).toBeNull())
    await userEvent.type(screen.getByRole('textbox'), 'metrics')
    expect(linkNames().length).toBe(1)
  })

  it('applies theme, density and columns to the document and survives a reload', async () => {
    await renderLoaded()
    await userEvent.click(screen.getByRole('radio', { name: 'Dark', hidden: true }))
    await userEvent.click(screen.getByRole('radio', { name: 'Compact', hidden: true }))
    await userEvent.click(screen.getByRole('radio', { name: '3', hidden: true }))
    const root = document.documentElement
    expect(root.dataset.theme).toBe('dark')
    expect(root.dataset.density).toBe('compact')
    expect(root.style.getPropertyValue('--columns')).toBe('3')

    await userEvent.click(screen.getByRole('radio', { name: 'System', hidden: true }))
    expect(root.dataset.theme).toBeUndefined()

    expect(JSON.parse(localStorage.getItem('pin.settings.v1') ?? '{}')).toMatchObject({
      density: 'compact',
      columns: 3,
    })
  })

  it('does not treat typing inside the panel as filtering', async () => {
    await renderLoaded()
    fireEvent.keyDown(screen.getByRole('radio', { name: 'Dark', hidden: true }), { key: 'x' })
    expect(document.activeElement).not.toBe(screen.getByRole('textbox'))
  })
})

describe('widget tile', () => {
  const widgetConfig: Config = {
    title: 'Lab',
    groups: [
      {
        name: 'Infra',
        bookmarks: [
          { name: 'Grafana', url: 'https://grafana.test/' },
          {
            name: 'Gatus',
            url: 'https://gatus.test/',
            widget: { id: '0', type: 'gatus' },
          },
        ],
      },
    ],
  }

  function renderWidget(status: () => Promise<Response>) {
    const fetchStub = vi.fn((input: RequestInfo | URL) =>
      input === 'api/config' ? Promise.resolve(Response.json(widgetConfig)) : status(),
    )
    vi.stubGlobal('fetch', fetchStub)
    render(() => <App />)
    return fetchStub
  }

  it('keeps the whole tile one link and names the counts', async () => {
    renderWidget(() => Promise.resolve(Response.json({ up: 12, down: 2 })))
    await screen.findByRole('link', { name: /12 up/ })
    const link = await gatusLink()
    expect(link.getAttribute('href')).toBe('https://gatus.test/')
    expect(link.textContent).toContain('12 up')
    expect(link.textContent).toContain('2 down')
    expect(link.querySelector('.readout-down')?.textContent).toContain('2 down')
  })

  it('stays quiet when nothing is down', async () => {
    renderWidget(() => Promise.resolve(Response.json({ up: 14, down: 0 })))
    const link = await screen.findByRole('link', { name: /14 up/ })
    expect(link.querySelector('.readout-down')).toBeNull()
    expect(link.querySelector('.readout-quiet')?.textContent).toContain('0 down')
  })

  it('claims no status while loading', async () => {
    renderWidget(() => new Promise(() => undefined))
    const link = await gatusLink()
    expect(link.querySelector('.readout')?.getAttribute('aria-hidden')).toBe('true')
  })

  it('says so when Gatus cannot be reached, and the link still works', async () => {
    renderWidget(() => Promise.resolve(new Response('widget unavailable', { status: 502 })))
    const link = await screen.findByRole('link', { name: /Can't reach Gatus/ })
    expect(link.getAttribute('href')).toBe('https://gatus.test/')
  })

  it('does not refetch or lose the counts while filtering', async () => {
    const fetchStub = renderWidget(() => Promise.resolve(Response.json({ up: 12, down: 2 })))
    await screen.findByRole('link', { name: /12 up/ })
    const before = fetchStub.mock.calls.length
    await userEvent.type(filterInput(), 'gat')
    expect(fetchStub.mock.calls.length).toBe(before)
    expect((await gatusLink()).textContent).toContain('12 up')
  })

  it('does not filter on the counts', async () => {
    renderWidget(() => Promise.resolve(Response.json({ up: 12, down: 2 })))
    await screen.findByRole('link', { name: /12 up/ })
    await userEvent.type(filterInput(), 'down')
    expect(screen.queryByRole('link', { name: /Gatus/ })).toBeNull()
  })
})
