# pin

Self-hosted bookmark dashboard driven by one YAML file. Links, labels and flat groups only: no widgets, no accounts, no in-app editing.

## Run

```sh
PIN_CONFIG_FILE=./pin.yaml docker compose up --build
```

Then open http://localhost:8080. Without `PIN_CONFIG_FILE`, compose uses `pin.example.yaml`.

pin has no authentication. Anyone who can reach it can read your links, so keep it on a trusted network or behind your own proxy.

## Configure

```yaml
title: Homelab Dashboard    # optional, default "pin"
labels:                     # optional
  vpn: "#0ea5e9"            # color is optional, quoted #rrggbb
  beta:
bookmarks:
  - name: Grafana           # required
    url: https://grafana.example.com  # required, http or https
    group: Infrastructure   # optional
    icon: grafana           # optional
    description: Metrics    # optional
    label: vpn              # optional, one label defined under labels
```

- Groups appear in order of first use. Ungrouped bookmarks come last, with no heading.
- A labelled bookmark shows a small tag with the label's name. A label not defined under `labels` counts as invalid.
- pin reads the file at startup, so restart after editing.
- A missing or invalid file stops startup, and every invalid entry is listed. Unknown keys count as invalid.

| Variable | Default | Purpose |
| --- | --- | --- |
| `PIN_CONFIG` | `/config/pin.yaml` | Config file path |
| `PIN_ADDR` | `:8080` | Listen address |

### Icons

Browsers load icons directly from these sources, so named icons need internet access. A bookmark whose icon is missing or fails to load shows its first letter instead.

| Value | Source |
| --- | --- |
| `grafana`, `grafana.svg`, `grafana.webp` | [Dashboard Icons](https://github.com/homarr-labs/dashboard-icons), png by default |
| `mdi-rss`, `mdi-rss-#7c6cf2` | [Material Design Icons](https://pictogrammers.com/library/mdi/), theme color or hex |
| `si-github`, `si-github-#181717` | [Simple Icons](https://simpleicons.org), theme color or hex |
| `sh-home-assistant`, `sh-home-assistant.svg` | [selfh.st icons](https://selfh.st/icons/), png by default |
| `https://example.com/icon.png` | That URL |

Local paths like `/icons/foo.png` are not supported.

## Use

- Start typing anywhere to filter by name, description, label or group. Enter opens the top match, Tab moves to the results, and Esc clears.
- Click a group's title bar to collapse it. Filtering still finds its links. Collapsed groups stay in that browser.
- The cog sets theme, columns, density, link target and descriptions. Settings stay in that browser.

## Install

pin installs as an app from your browser's own UI. Installing needs HTTPS or localhost.

- Chrome or Edge on desktop: use the install icon in the address bar.
- Android: Chrome menu, then Add to Home screen.
- iPhone or iPad: Share, then Add to Home Screen.

The installed app always opens links outside its window, so the link target setting is hidden there. On phones the OS may show them in an in-app browser view. pin needs its server to load: there is no offline mode.

## Develop

Tools are pinned with [mise](https://mise.jdx.dev).

```sh
mise install
mise run setup
mise run dev     # Go on :8080, Vite on :5173
mise run check   # format, lint, typecheck, test, build
```

`apps/server` is the Go server, and `apps/web` is the Solid app embedded into its binary.
