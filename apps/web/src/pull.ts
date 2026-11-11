import { createSignal, onCleanup, type Accessor } from 'solid-js'

export const pullResistance = 0.5
export const pullThreshold = 64
export const pullMax = 96
// Movement below this, on both axes, does not yet decide between a pull and a scroll.
const pullSlop = 4

export type PullPhase = 'idle' | 'pulling' | 'armed' | 'reloading'

export type PullToReload = { phase: Accessor<PullPhase>; distance: Accessor<number> }

export const pullDistance = (dy: number) => Math.min(pullMax, Math.max(0, dy) * pullResistance)

const insidePopover = (target: EventTarget | null) =>
  target instanceof Element && target.closest('[popover]') !== null

// Installed apps have no browser pull-to-refresh, so this stands in for it there. A browser
// tab keeps its own gesture, so nothing is attached unless enabled.
export function createPullToReload(enabled: boolean, reload: () => void): PullToReload {
  const [phase, setPhase] = createSignal<PullPhase>('idle')
  const [distance, setDistance] = createSignal(0)
  if (!enabled) return { phase, distance }

  let start: { x: number; y: number } | undefined
  let tracking = false

  const reset = () => {
    start = undefined
    tracking = false
    setPhase('idle')
    setDistance(0)
  }

  const onTouchStart = (event: TouchEvent) => {
    if (phase() === 'reloading') return
    const touch = event.touches[0]
    if (event.touches.length !== 1 || !touch || window.scrollY > 0 || insidePopover(event.target)) {
      reset()
      return
    }
    start = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0]
    if (!start || !touch) return
    const dx = touch.clientX - start.x
    const dy = touch.clientY - start.y
    if (!tracking) {
      if (Math.abs(dx) < pullSlop && Math.abs(dy) < pullSlop) return
      // Upward or sideways: a scroll or swipe, left to the browser.
      if (dy <= 0 || Math.abs(dx) > dy) {
        start = undefined
        return
      }
      tracking = true
    }
    if (event.cancelable) event.preventDefault()
    const next = pullDistance(dy)
    setDistance(next)
    setPhase(next >= pullThreshold ? 'armed' : 'pulling')
  }

  const onTouchEnd = () => {
    if (phase() === 'armed') {
      start = undefined
      tracking = false
      setPhase('reloading')
      setDistance(pullThreshold)
      reload()
    } else if (phase() !== 'reloading') {
      reset()
    }
  }

  const onTouchCancel = () => {
    if (phase() !== 'reloading') reset()
  }

  document.addEventListener('touchstart', onTouchStart, { passive: true })
  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onTouchEnd)
  document.addEventListener('touchcancel', onTouchCancel)
  onCleanup(() => {
    document.removeEventListener('touchstart', onTouchStart)
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onTouchEnd)
    document.removeEventListener('touchcancel', onTouchCancel)
  })

  return { phase, distance }
}
