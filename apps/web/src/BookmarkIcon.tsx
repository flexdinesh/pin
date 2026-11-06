import { createSignal, Match, onCleanup, onMount, Switch } from 'solid-js'
import type { Icon } from './api'

function monogram(name: string): string {
  return (/[\p{L}\p{N}]/u.exec(name)?.[0] ?? '?').toUpperCase()
}

export function BookmarkIcon(props: { name: string; icon?: Icon }) {
  const [failed, setFailed] = createSignal(false)
  const onFail = () => setFailed(true)

  // A CSS mask reports no load failure, so a mask icon is probed separately.
  onMount(() => {
    if (props.icon?.kind !== 'mask') return
    const probe = new Image()
    probe.addEventListener('error', onFail)
    probe.src = props.icon.src
    onCleanup(() => probe.removeEventListener('error', onFail))
  })

  const maskStyle = () => {
    const mask = `url("${props.icon?.src ?? ''}") center / contain no-repeat`
    return {
      'background-color': props.icon?.color ?? 'currentColor',
      '-webkit-mask': mask,
      mask,
    }
  }

  return (
    <span class="icon" aria-hidden="true">
      <Switch fallback={<span class="monogram">{monogram(props.name)}</span>}>
        <Match when={!failed() && props.icon?.kind === 'image'}>
          <img src={props.icon?.src} alt="" decoding="async" onError={onFail} />
        </Match>
        <Match when={!failed() && props.icon?.kind === 'mask'}>
          <span class="mask" style={maskStyle()} />
        </Match>
      </Switch>
    </span>
  )
}
