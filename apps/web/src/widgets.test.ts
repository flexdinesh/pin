import { createRoot, createSignal } from 'solid-js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWidgetStore, widgetRefreshMs, type WidgetStore } from './widgets'

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden })
  document.dispatchEvent(new Event('visibilitychange'))
}

function start(ids: () => string[] = () => ['0']) {
  let store: WidgetStore | undefined
  const dispose = createRoot((disposer) => {
    store = createWidgetStore(ids)
    return disposer
  })
  if (!store) throw new Error('store not created')
  return { store, dispose }
}

const settle = () => vi.advanceTimersByTimeAsync(0)
const fetchStub = vi.fn<typeof fetch>()

beforeEach(() => {
  vi.useFakeTimers()
  fetchStub.mockReset()
  fetchStub.mockImplementation(() => Promise.resolve(Response.json({ up: 12, down: 2 })))
  vi.stubGlobal('fetch', fetchStub)
})

afterEach(() => {
  setHidden(false)
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('widget store', () => {
  it('loads, then holds the counts', async () => {
    const { store, dispose } = start()
    expect(store.stateOf('0')).toEqual({ kind: 'loading' })
    await settle()
    expect(store.stateOf('0')).toEqual({ kind: 'ready', up: 12, down: 2 })
    expect(fetchStub.mock.calls[0]?.[0]).toBe('api/widgets/0')
    dispose()
  })

  it('requests nothing without widgets', async () => {
    const { dispose } = start(() => [])
    await vi.advanceTimersByTimeAsync(widgetRefreshMs * 2)
    expect(fetchStub).not.toHaveBeenCalled()
    dispose()
  })

  it('refreshes every 30 seconds', async () => {
    const { dispose } = start()
    await settle()
    expect(fetchStub).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(widgetRefreshMs - 1)
    expect(fetchStub).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(fetchStub).toHaveBeenCalledTimes(2)
    dispose()
  })

  it('stops while hidden and refreshes on return', async () => {
    const { dispose } = start()
    await settle()
    setHidden(true)
    await vi.advanceTimersByTimeAsync(widgetRefreshMs * 3)
    expect(fetchStub).toHaveBeenCalledTimes(1)
    setHidden(false)
    await settle()
    expect(fetchStub).toHaveBeenCalledTimes(2)
    dispose()
  })

  it('does not refresh early when the tab returns before one is due', async () => {
    const { dispose } = start()
    await settle()
    setHidden(true)
    await vi.advanceTimersByTimeAsync(widgetRefreshMs / 2)
    setHidden(false)
    await settle()
    expect(fetchStub).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(widgetRefreshMs / 2)
    expect(fetchStub).toHaveBeenCalledTimes(2)
    dispose()
  })

  it('waits for a tab that opens hidden', async () => {
    setHidden(true)
    const { store, dispose } = start()
    await vi.advanceTimersByTimeAsync(widgetRefreshMs)
    expect(fetchStub).not.toHaveBeenCalled()
    expect(store.stateOf('0')).toEqual({ kind: 'loading' })
    setHidden(false)
    await settle()
    expect(store.stateOf('0')).toEqual({ kind: 'ready', up: 12, down: 2 })
    dispose()
  })

  it('replaces old counts when a refresh fails, and recovers', async () => {
    const { store, dispose } = start()
    await settle()
    fetchStub.mockImplementationOnce(() =>
      Promise.resolve(new Response('widget unavailable', { status: 502 })),
    )
    await vi.advanceTimersByTimeAsync(widgetRefreshMs)
    expect(store.stateOf('0')).toEqual({ kind: 'unreachable' })
    await vi.advanceTimersByTimeAsync(widgetRefreshMs)
    expect(store.stateOf('0')).toEqual({ kind: 'ready', up: 12, down: 2 })
    dispose()
  })

  it('treats a network failure as unreachable', async () => {
    fetchStub.mockImplementationOnce(() => Promise.reject(new TypeError('offline')))
    const { store, dispose } = start()
    await settle()
    expect(store.stateOf('0')).toEqual({ kind: 'unreachable' })
    dispose()
  })

  it('tracks widgets separately', async () => {
    fetchStub.mockImplementation((input) =>
      Promise.resolve(
        input === 'api/widgets/1'
          ? new Response('', { status: 502 })
          : Response.json({ up: 1, down: 0 }),
      ),
    )
    const { store, dispose } = start(() => ['0', '1'])
    await settle()
    expect(store.stateOf('0')).toEqual({ kind: 'ready', up: 1, down: 0 })
    expect(store.stateOf('1')).toEqual({ kind: 'unreachable' })
    dispose()
  })

  it('stops refreshing and drops a late answer once disposed', async () => {
    fetchStub.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(Response.json({ up: 5, down: 5 })), 1000)
        }),
    )
    const { store, dispose } = start()
    dispose()
    await vi.advanceTimersByTimeAsync(widgetRefreshMs * 2)
    expect(fetchStub).toHaveBeenCalledTimes(1)
    expect(store.stateOf('0')).toEqual({ kind: 'loading' })
  })

  it('polls the new list when the widgets change', async () => {
    const [ids, setIds] = createSignal(['0'])
    const { dispose } = start(ids)
    await settle()
    setIds(['0', '1'])
    await settle()
    expect(fetchStub.mock.calls.map(([input]) => input)).toEqual([
      'api/widgets/0',
      'api/widgets/0',
      'api/widgets/1',
    ])
    dispose()
  })
})
