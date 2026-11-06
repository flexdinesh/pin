import Monitor from 'lucide-solid/icons/monitor'
import Moon from 'lucide-solid/icons/moon'
import Sun from 'lucide-solid/icons/sun'
import { For, Show, type JSX } from 'solid-js'
import {
  columnChoices,
  densities,
  linkTargets,
  themes,
  type Columns,
  type Density,
  type LinkTarget,
  type SettingsStore,
  type Theme,
} from './settings'

function Choice<T>(props: {
  legend: string
  options: readonly T[]
  label: (option: T) => string
  icon?: (option: T) => JSX.Element
  value: T
  onChange: (option: T) => void
}) {
  const name = () => `setting-${props.legend.toLowerCase().replaceAll(' ', '-')}`
  return (
    <fieldset class="choice">
      <legend>{props.legend}</legend>
      <div class="segments">
        <For each={props.options}>
          {(option) => (
            <label class="segment">
              <input
                type="radio"
                name={name()}
                checked={option === props.value}
                onChange={() => props.onChange(option)}
              />
              <span>
                {props.icon?.(option)}
                {props.label(option)}
              </span>
            </label>
          )}
        </For>
      </div>
    </fieldset>
  )
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const themeLabel = (theme: Theme) => capitalize(theme)
const themeIcon = (theme: Theme) => {
  const Icon = { system: Monitor, light: Sun, dark: Moon }[theme]
  return <Icon size={14} stroke-width={1.75} aria-hidden="true" />
}
const columnsLabel = (columns: Columns) => capitalize(String(columns))
const densityLabel = (density: Density) => capitalize(density)
const targetLabel = (target: LinkTarget) => (target === 'new' ? 'New tab' : 'Same tab')
const descriptionChoices: readonly boolean[] = [true, false]

export function SettingsPanel(props: { store: SettingsStore; id: string }) {
  const current = () => props.store.settings()
  return (
    <div id={props.id} popover="auto" role="dialog" class="settings" aria-label="Settings">
      <Choice
        legend="Theme"
        options={themes}
        label={themeLabel}
        icon={themeIcon}
        value={current().theme}
        onChange={(theme) => props.store.update({ theme })}
      />
      <Choice
        legend="Columns"
        options={columnChoices}
        label={columnsLabel}
        value={current().columns}
        onChange={(columns) => props.store.update({ columns })}
      />
      <Choice
        legend="Density"
        options={densities}
        label={densityLabel}
        value={current().density}
        onChange={(density) => props.store.update({ density })}
      />
      <Show when={!props.store.installed}>
        <Choice
          legend="Open links in"
          options={linkTargets}
          label={targetLabel}
          value={current().linkTarget}
          onChange={(linkTarget) => props.store.update({ linkTarget })}
        />
      </Show>
      <Choice
        legend="Descriptions"
        options={descriptionChoices}
        label={(show) => (show ? 'Show' : 'Hide')}
        value={current().showDescriptions}
        onChange={(showDescriptions) => props.store.update({ showDescriptions })}
      />
    </div>
  )
}
