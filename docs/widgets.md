# Widgets

A widget adds live counts to a bookmark's tile. The tile stays one link.

The pin server fetches the data, not the browser. So pin must be able to reach the app, and the app needs no CORS setup. Widget addresses never reach the browser.

Browsers refresh widgets every 30 seconds while the tab is visible.

## Gatus

Shows how many endpoints are up and down, by their latest result. Endpoints with no results yet are not counted.

```yaml
- name: Gatus
  url: https://status.example.com
  widget:
    type: gatus
    url: http://gatus.monitoring:8080  # optional
```

| Key | Required | Description |
| --- | --- | --- |
| `type` | yes | `gatus` |
| `url` | no | Where pin reaches Gatus. Defaults to the bookmark's `url`. Set it when pin reaches Gatus at another address, such as an internal hostname. |

pin reads `<url>/api/v1/endpoints/statuses` with no token and a 5 second timeout.

## Troubleshooting

A tile shows "Can't reach Gatus" when pin gets no usable answer. The cause goes to pin's log. Common causes:

- pin can't resolve or reach the address. Check `widget.url` from where pin runs, such as inside its container.
- Gatus requires authentication. pin sends no credentials.
- Gatus uses a certificate pin doesn't trust, such as a self-signed one. Point `widget.url` at its plain HTTP address.
