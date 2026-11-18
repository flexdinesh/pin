import { ChevronDown, House, Search, Settings, type LucideProps } from 'lucide-react'
import { Stage, Window } from '../../kit'
import './pin-cover.css'

// README cover for pin, a self-hosted bookmark dashboard driven by one YAML
// file. A still in the "wide hero" layout: pin in a browser window, inset top
// and left, running off the bottom; a pin.yaml card straddles its right edge
// over the open end of the last rows, so the grid reads as coming from one
// file. The stage ground is the README's own page color, so the window sits on
// GitHub, not on a plate.
//
// Real strings: the title, the filter placeholder, group names and counts,
// every tile (it is a link dashboard: the links are the content) and the YAML
// entry. Look: pin's DESIGN.md tokens (sharp corners, hairlines, IBM Plex Sans).

const CDN = 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg'

type Tile = { name: string; desc?: string; icon?: string; label?: 'vpn' | 'beta' }
type Group = { name: string; tiles: Tile[]; partial?: boolean }

const GROUPS: Group[] = [
  {
    name: 'Monitoring',
    tiles: [
      { name: 'Gatus', desc: 'Service health', icon: 'gatus' },
      { name: 'Grafana', desc: 'Metrics and dashboards', icon: 'grafana' },
      { name: 'Prometheus', desc: 'Metrics storage', icon: 'prometheus', label: 'vpn' },
      { name: 'Uptime Kuma', desc: 'Uptime checks', icon: 'uptime-kuma' },
    ],
  },
  {
    name: 'Media',
    partial: true,
    tiles: [
      { name: 'Jellyfin', desc: 'Movies and shows', icon: 'jellyfin' },
      { name: 'Immich', desc: 'Photos', icon: 'immich' },
      { name: 'Navidrome', desc: 'Music', icon: 'navidrome', label: 'beta' },
      { name: 'Audiobookshelf', desc: 'Audiobooks', icon: 'audiobookshelf' },
    ],
  },
  {
    name: 'Home',
    partial: true,
    tiles: [
      { name: 'Home Assistant', desc: 'Automations', icon: 'home-assistant' },
      { name: 'Proxmox', desc: 'Hypervisor', icon: 'proxmox', label: 'vpn' },
      { name: 'Router' },
    ],
  },
]

const ICON: LucideProps = {
  size: 17,
  strokeWidth: 1.75,
  strokeLinecap: 'square',
  strokeLinejoin: 'miter',
}

function TileView({ t }: { t: Tile }) {
  return (
    <div className="pc-tile">
      <div className="pc-tile__main">
        {t.icon ? (
          <img className="pc-tile__icon" src={`${CDN}/${t.icon}.svg`} alt="" />
        ) : (
          <span className="pc-tile__mono">{t.name.charAt(0)}</span>
        )}
        <div className="pc-tile__text">
          <div className="pc-tile__name">{t.name}</div>
          {t.desc && <div className="pc-tile__desc">{t.desc}</div>}
        </div>
        {t.label && (
          <span className="pc-tag">
            {t.label === 'vpn' && <span className="pc-tag__sq" />}
            {t.label}
          </span>
        )}
      </div>
    </div>
  )
}

function Pin() {
  return (
    <div className="pc-app">
      <div className="pc-bar">
        <div className="pc-bar__path">
          <House {...ICON} className="pc-glyph" />
          <span className="pc-bar__slash">/</span>
          <span className="pc-bar__title">Homelab</span>
        </div>
        <div className="pc-filter">
          <Search {...ICON} size={15} className="pc-glyph" />
          <span className="pc-filter__ph">Type to filter</span>
        </div>
        <Settings {...ICON} className="pc-glyph pc-bar__cog" />
      </div>
      <div className="pc-groups">
        {GROUPS.map((g) => (
          <section key={g.name} className="pc-group" data-partial={g.partial || undefined}>
            <div className="pc-group__head">
              <ChevronDown {...ICON} size={14} className="pc-glyph" />
              <span className="pc-group__name">{g.name}</span>
              <span className="pc-group__count">{g.tiles.length}</span>
            </div>
            <div className="pc-row">
              {g.tiles.map((t) => (
                <TileView key={t.name} t={t} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

const YAML: [string, string][] = [
  ['name', 'Grafana'],
  ['url', 'https://grafana.home.lan'],
  ['group', 'Monitoring'],
  ['icon', 'grafana'],
]

function YamlCard() {
  return (
    <div className="pc-yaml">
      <div className="pc-yaml__head">pin.yaml</div>
      <pre className="pc-yaml__code">
        {YAML.map(([k, v], i) => (
          <div key={k}>
            <span className="pc-y-punct">{i === 0 ? '- ' : '  '}</span>
            <span className="pc-y-key">{k}</span>
            <span className="pc-y-punct">: </span>
            <span className="pc-y-val">{v}</span>
          </div>
        ))}
      </pre>
    </div>
  )
}

export default function PinCover() {
  return (
    <Stage width={1040} height={540} className="pc">
      {() => (
        <>
          <Window url="pin.home.lan" urlShape="pill" className="pc-window">
            <Pin />
          </Window>
          <YamlCard />
        </>
      )}
    </Stage>
  )
}
