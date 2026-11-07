import { createEffect, createSignal, onCleanup } from 'solid-js'
import { fetchWidgetStatus, type WidgetStatus } from './api'

export const widgetRefreshMs = 30_000

export type WidgetState =
  | { kind: 'loading' }
  | { kind: 'unreachable' }
  | ({ kind: 'ready' } & WidgetStatus)

export type WidgetStore = { stateOf: (id: string) => WidgetState }

const loading: WidgetState = { kind: 'loading' }

// Lives above the tiles, because the filter remounts them on every keystroke. A hidden
// tab lets the timer lapse, and returning refreshes unless a refresh is already due.
export function createWidgetStore(ids: () => string[]): WidgetStore {
  const [states, setStates] = createSignal<ReadonlyMap<string, WidgetState>>(new Map())

  createEffect(() => {
    const current = ids()
    if (current.length === 0) return

    let controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined

    const refresh = () => {
      controller.abort()
      controller = new AbortController()
      const { signal } = controller
      for (const id of current) {
        const settle = (state: WidgetState) => {
          if (!signal.aborted) setStates((previous) => new Map(previous).set(id, state))
        }
        fetchWidgetStatus(id, signal).then(
          (status) => settle({ kind: 'ready', ...status }),
          () => settle({ kind: 'unreachable' }),
        )
      }
    }
    const tick = () => {
      timer = undefined
      if (document.hidden) return
      refresh()
      timer = setTimeout(tick, widgetRefreshMs)
    }
    const onVisibilityChange = () => {
      if (!document.hidden && timer === undefined) tick()
    }

    tick()
    document.addEventListener('visibilitychange', onVisibilityChange)
    onCleanup(() => {
      clearTimeout(timer)
      controller.abort()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    })
  })

  return { stateOf: (id) => states().get(id) ?? loading }
}
