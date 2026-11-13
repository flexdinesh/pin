# Usage

## Filter

Start typing anywhere to filter by name, description, label or group. On touch devices, tap the search field.

| Key | Action |
| --- | --- |
| Enter | Open the top match. |
| Tab | Move through the results. |
| Esc | Clear the filter. |

## Groups

Click a group's title bar to collapse it. The filter still finds links in collapsed groups. Each browser remembers which groups are collapsed.

## Settings

The cog sets these. Each browser keeps its own settings.

| Setting | Options |
| --- | --- |
| Theme | System, light, dark |
| Columns | Auto, 1 to 6 |
| Density | Comfortable, compact |
| Open links | New tab, same tab |
| Descriptions | Show, hide |

## Install as an app

Browsers offer to install pin only over HTTPS or on `localhost`.

- Chrome or Edge on desktop: the install icon in the address bar.
- Android: Chrome menu, then Add to Home screen.
- iPhone or iPad: Share, then Add to Home Screen.

The installed app always opens links outside its window, so it hides the link setting. On phones, the OS may open them in an in-app browser. Pull down from the top to reload. The app needs the pin server: it has no offline mode.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| Icon shows a letter | The icon name doesn't exist in that set, or the device can't reach `cdn.jsdelivr.net`. Check the name on the icon set's site. |
| No install option | Serve pin over HTTPS, or open it on `localhost`. |
| Blank page or 404s under a subpath | Load the page with a trailing slash, such as `/pin/`. See [deployment.md](deployment.md#subpath). |
| Config change not showing | Restart pin. It reads the config only at startup. |
