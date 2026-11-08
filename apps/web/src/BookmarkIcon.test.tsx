import { fireEvent, render } from '@solidjs/testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BookmarkIcon } from './BookmarkIcon'

const failingImage = class extends EventTarget {
  set src(_value: string) {
    queueMicrotask(() => this.dispatchEvent(new Event('error')))
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('BookmarkIcon', () => {
  it('renders an image icon', () => {
    const { container } = render(() => (
      <BookmarkIcon name="Grafana" icon={{ kind: 'image', src: 'https://i.test/g.png' }} />
    ))
    expect(container.querySelector('img')?.getAttribute('src')).toBe('https://i.test/g.png')
    expect(container.querySelector('.monogram')).toBeNull()
  })

  it('drops the halo only from an image icon that opts out', () => {
    const { container } = render(() => (
      <>
        <BookmarkIcon name="A" icon={{ kind: 'image', src: 'https://i.test/a.svg' }} />
        <BookmarkIcon name="B" icon={{ kind: 'image', src: 'https://i.test/b.svg' }} noHalo />
      </>
    ))
    const images = [...container.querySelectorAll('img')]
    expect(images.map((image) => image.classList.contains('no-halo'))).toEqual([false, true])
  })

  it('falls back to a monogram when an image fails', () => {
    const { container } = render(() => (
      <BookmarkIcon name="grafana" icon={{ kind: 'image', src: 'https://i.test/g.png' }} />
    ))
    const image = container.querySelector('img')
    if (!image) throw new Error('missing image')
    fireEvent.error(image)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('.monogram')?.textContent).toBe('G')
  })

  it('renders a mask icon', () => {
    const { container } = render(() => (
      <BookmarkIcon name="Reader" icon={{ kind: 'mask', src: 'https://i.test/r.svg' }} />
    ))
    expect(container.querySelector('.mask')).not.toBeNull()
  })

  it('falls back to a monogram when a mask source fails', async () => {
    vi.stubGlobal('Image', failingImage)
    const { container } = render(() => (
      <BookmarkIcon name="Reader" icon={{ kind: 'mask', src: 'https://i.test/r.svg' }} />
    ))
    await Promise.resolve()
    expect(container.querySelector('.mask')).toBeNull()
    expect(container.querySelector('.monogram')?.textContent).toBe('R')
  })

  it('uses a monogram without an icon, skipping leading symbols', () => {
    const { container } = render(() => <BookmarkIcon name="(staging) app" />)
    expect(container.querySelector('.monogram')?.textContent).toBe('S')
  })
})
