# Contributing

## Setup

Install [mise](https://mise.jdx.dev). It installs the pinned Go, Node and pnpm versions.

```sh
mise install
mise run setup
mise run dev     # Go server on :8080 and Vite on :5173
```

Open http://localhost:5173. Vite proxies `/api` to the Go server, which serves `pin.example.yaml`.

## Tasks

| Task | Does |
| --- | --- |
| `mise run dev` | Run the server and Vite together. |
| `mise run build` | Build the web app, then `bin/pin` with it embedded. |
| `mise run test` | Web tests, web build, then Go tests against the build. |
| `mise run fmt` | Format Go and web sources. |
| `mise run check` | Format check, lint, typecheck, test and build. CI runs this. |

`mise tasks` lists them all.

## Layout

| Path | Contents |
| --- | --- |
| `apps/server` | Go server: config parsing, HTTP routes, widgets. Embeds the built web app from `internal/webui/dist`. |
| `apps/web` | Solid + Vite web app. |
| `docs` | User docs. |
| `DESIGN.md`, `PRODUCT.md` | Design system and product notes. Read them before UI changes. |

`go install` does not work, because the binary needs the built web app. Use `mise run build`.

## Pull requests

- One change per PR. Open an issue first for large changes.
- Title in [Conventional Commits](https://www.conventionalcommits.org) form, such as `feat: add uptime kuma widget`. The release changelog is built from these.
- Add tests for behavior changes.
- Update `docs/` when behavior, config, env vars or flags change.
- `mise run check` passes.

## Releases

Maintainers push a `vX.Y.Z` tag. CI publishes binaries to GitHub Releases and images to `ghcr.io/flexdinesh/pin`.
