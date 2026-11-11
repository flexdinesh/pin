import { fireEvent } from '@solidjs/testing-library'
import { createRoot } from 'solid-js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createPullToReload, pullDistance, pullMax, pullThreshold, type PullToReload } from './pull'

let dispose: (() => void) | undefined

afterEach(() => {
  dispose?.()
  dispose = undefined
  document.body.replaceChildren()
  Reflect.deleteProperty(window, 'scrollY')
})

function setup(enabled = true) {
  const reload = vi.fn()
  const pull = createRoot((disposeRoot): PullToReload => {
    dispose = disposeRoot
    return createPullToReload(enabled, reload)
  })
  return { pull, reload }
}

const at = (clientY: number, clientX = 0) => ({ touches: [{ clientX, clientY }] })

function drag(dy: number, target: Document | Element = document, dx = 0) {
  fireEvent.touchStart(target, at(100))
  fireEvent.touchMove(target, at(100 + dy, dx))
}

describe('pullDistance', () => {
  it('halves the drag and caps it', () => {
    expect(pullDistance(-20)).toBe(0)
    expect(pullDistance(40)).toBe(20)
    expect(pullDistance(pullThreshold * 2)).toBe(pullThreshold)
    expect(pullDistance(1000)).toBe(pullMax)
  })
})

describe('createPullToReload', () => {
  it('follows the finger, arms at the threshold and reloads on release', () => {
    const { pull, reload } = setup()
    drag(60)
    expect(pull.phase()).toBe('pulling')
    expect(pull.distance()).toBe(30)
    fireEvent.touchMove(document, at(100 + pullThreshold * 2))
    expect(pull.phase()).toBe('armed')
    fireEvent.touchEnd(document, { touches: [] })
    expect(pull.phase()).toBe('reloading')
    expect(pull.distance()).toBe(pullThreshold)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('settles back without reloading when released early', () => {
    const { pull, reload } = setup()
    drag(60)
    fireEvent.touchEnd(document, { touches: [] })
    expect(pull.phase()).toBe('idle')
    expect(pull.distance()).toBe(0)
    expect(reload).not.toHaveBeenCalled()
  })

  it('leaves the page scroll alone while pulling but not before', () => {
    setup()
    fireEvent.touchStart(document, at(100))
    expect(fireEvent.touchMove(document, at(102))).toBe(true)
    expect(fireEvent.touchMove(document, at(140))).toBe(false)
  })

  it('ignores upward and sideways drags', () => {
    const { pull } = setup()
    drag(-40)
    fireEvent.touchMove(document, at(200))
    expect(pull.phase()).toBe('idle')
    drag(20, document, 40)
    fireEvent.touchMove(document, at(200))
    expect(pull.phase()).toBe('idle')
  })

  it('ignores a drag when the page is scrolled', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 })
    const { pull } = setup()
    drag(200)
    expect(pull.phase()).toBe('idle')
  })

  it('ignores a drag that starts inside a popover', () => {
    const sheet = document.createElement('div')
    sheet.setAttribute('popover', '')
    document.body.append(sheet)
    const { pull } = setup()
    drag(200, sheet)
    expect(pull.phase()).toBe('idle')
  })

  it('cancels when a second finger lands', () => {
    const { pull, reload } = setup()
    drag(200)
    fireEvent.touchStart(document, {
      touches: [
        { clientX: 0, clientY: 300 },
        { clientX: 50, clientY: 100 },
      ],
    })
    expect(pull.phase()).toBe('idle')
    fireEvent.touchEnd(document, { touches: [] })
    expect(reload).not.toHaveBeenCalled()
  })

  it('cancels on touchcancel', () => {
    const { pull } = setup()
    drag(200)
    fireEvent.touchCancel(document, { touches: [] })
    expect(pull.phase()).toBe('idle')
    expect(pull.distance()).toBe(0)
  })

  it('does nothing when disabled', () => {
    const { pull, reload } = setup(false)
    drag(200)
    fireEvent.touchEnd(document, { touches: [] })
    expect(pull.phase()).toBe('idle')
    expect(reload).not.toHaveBeenCalled()
  })
})
