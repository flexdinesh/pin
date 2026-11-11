import ArrowDown from 'lucide-solid/icons/arrow-down'
import ArrowUp from 'lucide-solid/icons/arrow-up'
import ChevronDown from 'lucide-solid/icons/chevron-down'
import ChevronRight from 'lucide-solid/icons/chevron-right'
import CornerDownLeft from 'lucide-solid/icons/corner-down-left'
import House from 'lucide-solid/icons/house'
import RotateCw from 'lucide-solid/icons/rotate-cw'
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
  on,
  onCleanup,
  onMount,
  Show,
  Switch,
} from 'solid-js'
import { fetchConfig, type Bookmark, type Config, type Group } from './api'
import { BookmarkIcon } from './BookmarkIcon'
import { createCollapse, type CollapseStore } from './collapse'
import { filterGroups, topMatch } from './filter'
import { createPullToReload, type PullToReload } from './pull'
import { createSettings, type SettingsStore } from './settings'
import { SettingsPanel } from './SettingsPanel'
import { fitTiles, keepTilesFitted } from './tiles'
import { createWidgetStore, type WidgetState, type WidgetStore } from './widgets'

const settingsPanelId = 'settings-panel'
const filterHintId = 'filter-hint'

const countBookmarks = (groups: Group[]) =>
  groups.reduce((total, group) => total + group.bookmarks.length, 0)

function ReadoutCell(props: { value: string; label: string; class?: string }) {
  return (
    <span class={`readout-cell ${props.class ?? ''}`}>
      <span class="readout-value">{props.value}</span> {props.label}
    </span>
  )
}

function WidgetReadout(props: { state: WidgetState }) {
  return (
    <Switch>
      <Match when={props.state.kind === 'unreachable'}>
        <span class="readout readout-off">Can't reach Gatus</span>
      </Match>
      <Match when={props.state.kind === 'loading'}>
        {/* Nothing is known yet, so the link's name carries no status. */}
        <span class="readout" aria-hidden="true">
          <ReadoutCell value="–" label="up" class="readout-quiet" />
          <ReadoutCell value="–" label="down" class="readout-quiet" />
        </span>
      </Match>
      <Match when={props.state.kind === 'ready' && props.state}>
        {(ready) => (
          <span class="readout">
            <ReadoutCell value={String(ready().up)} label="up" />
            <ReadoutCell
              value={String(ready().down)}
              label="down"
              class={ready().down > 0 ? 'readout-down' : 'readout-quiet'}
            />
          </span>
        )}
      </Match>
    </Switch>
  )
}

function BookmarkCell(props: {
  bookmark: Bookmark
  top: boolean
  filtering: boolean
  store: SettingsStore
  widgets: WidgetStore
}) {
  const settings = () => props.store.settings()
  return (
    <li>
      <a
        class="cell"
        classList={{
          top: props.top,
          filtered: props.filtering,
          'cell-widget': props.bookmark.widget !== undefined,
        }}
        href={props.bookmark.url}
        target={props.store.linkTarget() === 'new' ? '_blank' : undefined}
        rel={props.store.linkTarget() === 'new' ? 'noopener' : undefined}
        title={props.bookmark.description}
        data-top-match={props.top ? '' : undefined}
      >
        <span class="cell-main">
          <BookmarkIcon
            name={props.bookmark.name}
            icon={props.bookmark.icon}
            noHalo={props.bookmark.noHalo}
          />
          <span class="cell-text">
            <span class="cell-name">{props.bookmark.name}</span>
            <Show when={settings().showDescriptions && props.bookmark.description}>
              <span class="cell-description">{props.bookmark.description}</span>
            </Show>
          </span>
          <Show when={props.bookmark.label}>
            {(label) => (
              <span class="tag" title={label().name}>
                <span class="visually-hidden">Label: </span>
                <Show when={label().color}>
                  {(color) => (
                    <span
                      class="tag-color"
                      style={{ 'background-color': color() }}
                      aria-hidden="true"
                    />
                  )}
                </Show>
                <span class="tag-name">{label().name}</span>
              </span>
            )}
          </Show>
          {/* CSS shows it on the cell Enter would open: the top match or the focused cell. */}
          <Show when={props.filtering}>
            <kbd class="enter-hint" aria-hidden="true">
              <CornerDownLeft size={13} stroke-width={1.75} />
            </kbd>
          </Show>
        </span>
        <Show when={props.bookmark.widget}>
          {(widget) => <WidgetReadout state={props.widgets.stateOf(widget().id)} />}
        </Show>
      </a>
    </li>
  )
}

function GroupTiles(props: {
  group: Group
  top: Bookmark | undefined
  filtering: boolean
  store: SettingsStore
  widgets: WidgetStore
}) {
  const [list, setList] = createSignal<HTMLUListElement>()
  // Settings change the lanes and the text. The filter adds the Enter hint.
  createEffect(
    on(
      [list, () => props.group.bookmarks, () => props.store.settings(), () => props.filtering],
      ([element]) => {
        if (element) fitTiles(element)
      },
    ),
  )
  createEffect(() => {
    const element = list()
    if (element) onCleanup(keepTilesFitted(element))
  })
  return (
    <ul class="cells" ref={setList}>
      <For each={props.group.bookmarks}>
        {(bookmark) => (
          <BookmarkCell
            bookmark={bookmark}
            top={bookmark === props.top}
            filtering={props.filtering}
            store={props.store}
            widgets={props.widgets}
          />
        )}
      </For>
    </ul>
  )
}

function GroupPanel(props: {
  group: Group
  total: number | undefined
  top: Bookmark | undefined
  filtering: boolean
  store: SettingsStore
  collapse: CollapseStore
  widgets: WidgetStore
}) {
  const count = () =>
    props.total === undefined
      ? String(props.group.bookmarks.length)
      : `${props.group.bookmarks.length}/${props.total}`
  // The filter shows every match, so it overrides a saved collapse without changing it.
  const collapsed = () => !props.filtering && props.collapse.isCollapsed(props.group.name)
  return (
    <section
      class="group"
      classList={{ collapsed: collapsed() }}
      aria-label={props.group.name || 'Other bookmarks'}
    >
      <Show when={props.group.name}>
        <header class="group-header">
          <h2>
            {/* Disabled while filtering, so Tab from the filter reaches results directly. */}
            <button
              type="button"
              class="group-toggle"
              aria-expanded={!collapsed()}
              disabled={props.filtering}
              onClick={() => props.collapse.toggle(props.group.name)}
            >
              <Show
                when={collapsed()}
                fallback={<ChevronDown size={14} stroke-width={1.75} aria-hidden="true" />}
              >
                <ChevronRight size={14} stroke-width={1.75} aria-hidden="true" />
              </Show>
              {props.group.name}
            </button>
          </h2>
          <span class="group-count">{count()}</span>
        </header>
      </Show>
      <Show when={!collapsed()}>
        <GroupTiles
          group={props.group}
          top={props.top}
          filtering={props.filtering}
          store={props.store}
          widgets={props.widgets}
        />
      </Show>
    </section>
  )
}

function Dashboard(props: {
  config: Config
  query: string
  onClear: () => void
  store: SettingsStore
  collapse: CollapseStore
  widgets: WidgetStore
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
            <GroupPanel
              group={group}
              total={totalOf(group.name)}
              top={top()}
              filtering={filtering()}
              store={props.store}
              collapse={props.collapse}
              widgets={props.widgets}
            />
          )}
        </For>
      </Match>
    </Switch>
  )
}

// True while the content tracks the finger. Otherwise any offset eases back.
const following = (pull: PullToReload) => pull.phase() === 'pulling' || pull.phase() === 'armed'

// The touch gesture is its own feedback, so this stays out of the accessibility tree.
function PullIndicator(props: { pull: PullToReload }) {
  return (
    <div
      class="pull"
      classList={{
        armed: props.pull.phase() === 'armed',
        reloading: props.pull.phase() === 'reloading',
        settling: !following(props.pull),
      }}
      style={{ height: `${props.pull.distance()}px` }}
      aria-hidden="true"
    >
      <Switch>
        <Match when={props.pull.phase() === 'reloading'}>
          <RotateCw size={16} stroke-width={1.75} />
          Reloading
        </Match>
        <Match when={props.pull.phase() === 'armed'}>
          <ArrowUp size={16} stroke-width={1.75} />
          Release to reload
        </Match>
        <Match when={true}>
          <ArrowDown size={16} stroke-width={1.75} />
          Pull to reload
        </Match>
      </Switch>
    </div>
  )
}

function startsFilter(event: KeyboardEvent, hasQuery: boolean): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey || event.isComposing) return false
  const types = event.key.length === 1 && event.key !== ' '
  if (!types && !(event.key === 'Backspace' && hasQuery)) return false
  const target = event.target
  if (!(target instanceof Element)) return true
  return target.closest('input, textarea, select, [popover]') === null
}

export function App() {
  const store = createSettings()
  const collapse = createCollapse()
  const pull = createPullToReload(store.installed, () => window.location.reload())
  const [config, { refetch }] = createResource(fetchConfig)
  const [query, setQuery] = createSignal('')
  const [input, setInput] = createSignal<HTMLInputElement>()
  const [results, setResults] = createSignal<HTMLElement>()

  const clear = () => setQuery('')
  // Clearing can remove the focused element, so focus has to go somewhere deliberate.
  const clearAndFocus = () => {
    clear()
    input()?.focus()
  }
  const loaded = () => (config.state === 'ready' ? config() : undefined)
  const widgetIds = createMemo(
    () =>
      loaded()?.groups.flatMap((group) =>
        group.bookmarks.flatMap((bookmark) => (bookmark.widget ? [bookmark.widget.id] : [])),
      ) ?? [],
  )
  const widgets = createWidgetStore(widgetIds)
  const matchCount = createMemo(() => {
    const current = loaded()
    return current ? countBookmarks(filterGroups(current.groups, query())) : 0
  })
  const total = () => {
    const current = loaded()
    return current ? countBookmarks(current.groups) : 0
  }
  const status = () => {
    if (!loaded() || query().trim() === '') return ''
    return matchCount() === 0 ? 'No matches' : `${matchCount()} of ${total()} bookmarks`
  }

  createEffect(() => {
    const title = loaded()?.title
    if (title) document.title = title
  })

  // Safari, and Firefox on macOS, leave links out of the Tab order by default, so while
  // filtering, Tab and Shift+Tab move through the filter and results here instead.
  const moveThroughResults = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.metaKey || event.altKey || query().trim() === '') return
    const field = input()
    const main = results()
    if (!field || !main) return
    const stops = [field, ...main.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)')]
    const index = stops.findIndex((stop) => stop === document.activeElement)
    if (index === -1) return
    // Past either end, the browser's own order takes over.
    const next = stops[index + (event.shiftKey ? -1 : 1)]
    if (!next) return
    event.preventDefault()
    next.focus()
  }

  const onDocumentKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Tab') {
      moveThroughResults(event)
    } else if (startsFilter(event, query() !== '')) {
      // Focus restores a selection left by tabbing through the field, and a keystroke
      // from elsewhere must extend the query rather than replace it.
      const field = input()
      field?.focus()
      field?.setSelectionRange(field.value.length, field.value.length)
    } else if (event.key === 'Escape' && query() !== '') {
      const fromResults = event.target instanceof Element && event.target.closest('main') !== null
      if (fromResults) clearAndFocus()
      else clear()
    }
  }

  onMount(() => {
    document.addEventListener('keydown', onDocumentKeyDown)
    onCleanup(() => document.removeEventListener('keydown', onDocumentKeyDown))
  })

  const onInputKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      // The first Escape clears, through the document handler, and keeps focus here.
      if (query() === '') input()?.blur()
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

  // Enter on a focused result behaves like Enter on the filter. Mouse, touch and
  // modified activations keep the filter, so several results can be opened.
  const onResultsClick = (event: MouseEvent) => {
    if (event.detail !== 0 || query().trim() === '') return
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return
    if (!(event.target instanceof Element)) return
    const link = event.target.closest('a')
    if (link === null || link !== document.activeElement) return
    // Clearing removes the link, so wait until the browser has followed it.
    setTimeout(clearAndFocus)
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
        {/* Before the filter in Tab order, so Tab from the filter reaches results directly.
            Grid placement keeps it visually at the far end. */}
        <button
          type="button"
          class="icon-button"
          aria-label="Settings"
          popovertarget={settingsPanelId}
        >
          <SettingsIcon size={17} stroke-width={1.75} aria-hidden="true" />
        </button>
        <div class="filter" role="search">
          <Search size={16} stroke-width={1.75} aria-hidden="true" />
          <input
            ref={setInput}
            type="text"
            aria-label="Filter bookmarks"
            aria-describedby={filterHintId}
            placeholder="Type to filter"
            autocomplete="off"
            enterkeyhint="go"
            autocapitalize="off"
            spellcheck={false}
            value={query()}
            onInput={(event) => setQuery(event.currentTarget.value)}
            onKeyDown={onInputKeyDown}
          />
          <span id={filterHintId} class="visually-hidden">
            Enter opens the top match. Tab moves to results. Escape clears.
          </span>
          {/* Stays mounted: a live region added with its text may not be announced. */}
          <span class="visually-hidden" role="status">
            {status()}
          </span>
          <Show when={query() !== ''}>
            <span class="filter-count" aria-hidden="true">
              {matchCount()}/{total()}
            </span>
            {/* Out of the Tab order so results are one Tab away. Escape does the same. */}
            <button
              type="button"
              class="filter-clear"
              tabindex={-1}
              aria-label="Clear filter"
              onClick={clearAndFocus}
            >
              <X size={16} stroke-width={1.75} aria-hidden="true" />
            </button>
          </Show>
        </div>
      </header>
      <SettingsPanel store={store} id={settingsPanelId} />
      <Show when={store.installed}>
        <PullIndicator pull={pull} />
      </Show>
      <main
        class="groups"
        classList={{ settling: !following(pull) }}
        style={{
          transform: pull.distance() > 0 ? `translateY(${pull.distance()}px)` : undefined,
        }}
        ref={setResults}
        onClick={onResultsClick}
      >
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
              <Dashboard
                config={current()}
                query={query()}
                onClear={clearAndFocus}
                store={store}
                collapse={collapse}
                widgets={widgets}
              />
            )}
          </Match>
        </Switch>
      </main>
    </>
  )
}
