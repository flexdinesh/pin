import { fireEvent, render, screen, waitFor } from '@solidjs/testing-library'
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
    expect(screen.getByRole('status').textContent).toBe('1/3')
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

describe('settings', () => {
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
