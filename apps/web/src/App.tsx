import CornerDownLeft from 'lucide-solid/icons/corner-down-left'
import House from 'lucide-solid/icons/house'
import Search from 'lucide-solid/icons/search'
import SettingsIcon from 'lucide-solid/icons/settings'
import X from 'lucide-solid/icons/x'
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  Match,
  onCleanup,
  onMount,
  Show,
  Switch,
} from 'solid-js'
import { fetchConfig, type Bookmark, type Config, type Group } from './api'
import { BookmarkIcon } from './BookmarkIcon'
import { filterGroups, topMatch } from './filter'
import { createSettings, type SettingsStore } from './settings'
import { SettingsPanel } from './SettingsPanel'

const settingsPanelId = 'settings-panel'

const countBookmarks = (groups: Group[]) =>
  groups.reduce((total, group) => total + group.bookmarks.length, 0)

function BookmarkCell(props: { bookmark: Bookmark; top: boolean; store: SettingsStore }) {
  const settings = () => props.store.settings()
  return (
    <li>
      <a
        class="cell"
        classList={{ top: props.top }}
        href={props.bookmark.url}
        target={settings().linkTarget === 'new' ? '_blank' : undefined}
        rel={settings().linkTarget === 'new' ? 'noopener' : undefined}
        title={props.bookmark.description}
        data-top-match={props.top ? '' : undefined}
      >
        <BookmarkIcon name={props.bookmark.name} icon={props.bookmark.icon} />
        <span class="cell-text">
          <span class="cell-name">{props.bookmark.name}</span>
          <Show when={settings().showDescriptions && props.bookmark.description}>
            <span class="cell-description">{props.bookmark.description}</span>
          </Show>
        </span>
        <Show when={props.top}>
          <kbd class="enter-hint" aria-label="Press Enter to open">
            <CornerDownLeft size={13} stroke-width={1.75} aria-hidden="true" />
          </kbd>
        </Show>
      </a>
    </li>
  )
}

function GroupPanel(props: {
  group: Group
  total: number | undefined
  top: Bookmark | undefined
  store: SettingsStore
}) {
  const count = () =>
    props.total === undefined
      ? String(props.group.bookmarks.length)
      : `${props.group.bookmarks.length}/${props.total}`
  return (
    <section class="group" aria-label={props.group.name || 'Other bookmarks'}>
      <Show when={props.group.name}>
        <header class="group-header">
          <h2>{props.group.name}</h2>
          <span class="group-count">{count()}</span>
        </header>
      </Show>
      <ul class="cells">
        <For each={props.group.bookmarks}>
          {(bookmark) => (
            <BookmarkCell bookmark={bookmark} top={bookmark === props.top} store={props.store} />
          )}
        </For>
      </ul>
    </section>
  )
}

function Dashboard(props: {
  config: Config
  query: string
  onClear: () => void
  store: SettingsStore
}) {
  const visible = createMemo(() => filterGroups(props.config.groups, props.query))
  const filtering = () => props.query.trim() !== ''
  const top = () => (filtering() ? topMatch(visible(), props.query) : undefined)
  const totalOf = (name: string) =>
    filtering()
      ? props.config.groups.find((group) => group.name === name)?.bookmarks.length
      : undefined

  return (
    <Switch>
      <Match when={props.config.groups.length === 0}>
        <div class="notice">
          <p class="notice-title">No bookmarks yet</p>
          <p>Add entries under bookmarks in your pin config, then restart pin.</p>
        </div>
      </Match>
      <Match when={visible().length === 0}>
        <div class="notice">
          <p class="notice-title">No bookmarks match “{props.query.trim()}”</p>
          <button type="button" class="button" onClick={() => props.onClear()}>
            Clear filter
          </button>
        </div>
      </Match>
      <Match when={visible().length > 0}>
        <For each={visible()}>
          {(group) => (
            <GroupPanel group={group} total={totalOf(group.name)} top={top()} store={props.store} />
          )}
        </For>
      </Match>
    </Switch>
  )
}

function startsFilter(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return false
  if (event.key.length !== 1 || event.key === ' ') return false
  const target = event.target
  if (!(target instanceof Element)) return true
  return target.closest('input, textarea, select, [popover]') === null
}

export function App() {
  const store = createSettings()
  const [config, { refetch }] = createResource(fetchConfig)
  const [query, setQuery] = createSignal('')
  const [input, setInput] = createSignal<HTMLInputElement>()

  const clear = () => setQuery('')
  const loaded = () => (config.state === 'ready' ? config() : undefined)
  const matchCount = createMemo(() => {
    const current = loaded()
    return current ? countBookmarks(filterGroups(current.groups, query())) : 0
  })
  const total = () => {
    const current = loaded()
    return current ? countBookmarks(current.groups) : 0
  }

  createEffect(() => {
    const title = loaded()?.title
    if (title) document.title = title
  })

  const onDocumentKeyDown = (event: KeyboardEvent) => {
    if (startsFilter(event)) {
      input()?.focus()
    } else if (event.key === 'Escape' && query() !== '') {
      clear()
    }
  }

  onMount(() => {
    document.addEventListener('keydown', onDocumentKeyDown)
    onCleanup(() => document.removeEventListener('keydown', onDocumentKeyDown))
  })

  const onInputKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      input()?.blur()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const link = document.querySelector('[data-top-match]')
      if (link instanceof HTMLElement) {
        link.click()
        // A link opened in a new tab must not leave this page still filtered.
        clear()
      }
    }
  }

  return (
    <>
      <header class="bar">
        <h1 class="title">
          <House size={17} stroke-width={1.75} aria-hidden="true" />
          <span class="title-separator" aria-hidden="true">
            /
          </span>
          <span class="title-text">{loaded()?.title}</span>
        </h1>
        <div class="filter" role="search">
          <Search size={16} stroke-width={1.75} aria-hidden="true" />
          <input
            ref={setInput}
            type="text"
            aria-label="Filter bookmarks"
            placeholder="Type to filter"
            autocomplete="off"
            enterkeyhint="go"
            autocapitalize="off"
            spellcheck={false}
            value={query()}
            onInput={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={onInputKeyDown}
          />
          <Show when={query() !== ''}>
            <span class="filter-count" role="status">
              {matchCount()}/{total()}
            </span>
            <button
              type="button"
              class="filter-clear"
              aria-label="Clear filter"
              onClick={() => {
                clear()
                input()?.focus()
              }}
            >
              <X size={16} stroke-width={1.75} aria-hidden="true" />
            </button>
          </Show>
        </div>
        <button
          type="button"
          class="icon-button"
          aria-label="Settings"
          popovertarget={settingsPanelId}
        >
          <SettingsIcon size={17} stroke-width={1.75} aria-hidden="true" />
        </button>
      </header>
      <SettingsPanel store={store} id={settingsPanelId} />
      <main class="groups">
        <Switch>
          <Match when={config.error !== undefined}>
            <div class="notice" role="alert">
              <p class="notice-title">Couldn't load bookmarks</p>
              <p>The pin server didn't return a usable config.</p>
              <button type="button" class="button" onClick={() => void refetch()}>
                Retry
              </button>
            </div>
          </Match>
          <Match when={loaded()}>
            {(current) => (
              <Dashboard config={current()} query={query()} onClear={clear} store={store} />
            )}
          </Match>
        </Switch>
      </main>
    </>
  )
}
