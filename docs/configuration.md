# Configuration

pin reads one YAML file at startup. Restart pin after editing it.

A missing or invalid file stops startup. pin lists every problem, then exits with status 1:

```text
pin: invalid config pin.yaml:
labels.vpn: quote the color, or YAML reads it as a comment
bookmarks[0]: url: must be http or https: "ftp://nas"
```

## File

```yaml
title: Homelab              # optional, default "pin"
labels:                     # optional
  vpn: "#0ea5e9"            # optional color, quoted #rrggbb
  beta:                     # no color: neutral tag
bookmarks:
  - name: Grafana           # required
    url: https://grafana.example.com  # required, http or https
    group: Monitoring       # optional
    icon: grafana           # optional, see Icons
    halo: false             # optional, default true, image icons only
    description: Metrics    # optional
    label: vpn              # optional, must be defined under labels
    widget:                 # optional, see widgets.md
      type: gatus
```

### Top-level keys

| Key | Required | Description |
| --- | --- | --- |
| `title` | no | Page and app title. Default `pin`. |
| `labels` | no | Map of label name to optional color. |
| `bookmarks` | yes | List of bookmarks. |

### Bookmark keys

| Key | Required | Description |
| --- | --- | --- |
| `name` | yes | Tile text. |
| `url` | yes | `http` or `https` URL with a host. |
| `group` | no | Group heading. Groups appear in order of first use. Ungrouped bookmarks come last, with no heading. |
| `icon` | no | See [Icons](#icons). Without one, the tile shows the name's first letter. |
| `halo` | no | `false` drops the faint outline around an image icon. Use it for logos that are opaque squares, where the halo draws a frame. |
| `description` | no | Short text under the name. |
| `label` | no | One label name from `labels`. Shown as a small tag. |
| `widget` | no | Live status. See [widgets.md](widgets.md). |

### Rules

- Unknown keys are errors, which catches typos.
- Duplicate keys and duplicate label names are errors.
- Quote label colors. YAML reads an unquoted `#0ea5e9` as a comment.

## Icons

Browsers load icons straight from the source, so named icons need internet access on the viewing device. If an icon fails to load, the tile shows the name's first letter.

| Value | Source |
| --- | --- |
| `grafana`, `grafana.svg`, `grafana.webp` | [Dashboard Icons](https://github.com/homarr-labs/dashboard-icons). PNG by default. |
| `sh-home-assistant`, `sh-home-assistant.svg` | [selfh.st icons](https://selfh.st/icons/). PNG by default. |
| `mdi-rss`, `mdi-rss-#7c6cf2` | [Material Design Icons](https://pictogrammers.com/library/mdi/). Theme color, or a hex color. |
| `si-github`, `si-github-#181717` | [Simple Icons](https://simpleicons.org). Theme color, or a hex color. |
| `https://example.com/icon.png` | That URL. |

Named icons load from `cdn.jsdelivr.net`. Local paths like `/icons/foo.png` are not supported. To use your own image, host it anywhere the browser can reach and use its URL.

## Env vars and flags

Flags override env vars, which override defaults.

| Env var | Flag | Default | Description |
| --- | --- | --- | --- |
| `PIN_CONFIG` | `--config` | `pin.yaml` (`/config/pin.yaml` in Docker) | Config file path. |
| `PIN_LISTEN` | `--listen` | `:8080` | `host:port`, or `unix:/path/to.sock`. |
| `PIN_BASE_PATH` | `--base-path` | none | URL prefix such as `/pin`. See [deployment.md](deployment.md#subpath). |
| `PIN_SOCKET_MODE` | `--socket-mode` | `0660` | File mode for a unix socket. |

## Commands

| Command | Description |
| --- | --- |
| `pin serve` | Start the server. |
| `pin healthcheck` | Exit 0 if the server on `PIN_LISTEN` answers `/healthz`. Takes the same flags as `serve`. |
| `pin version` | Print the version. |

`pin serve -h` lists the flags.
