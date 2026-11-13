# Security

## Model

pin has no authentication by design. Anyone who can reach it can read every bookmark, label and widget count. Run it on a trusted network, or behind a proxy that authenticates.

- Widget addresses stay on the server. Browsers only see a widget's ID and counts.
- Widget errors go to the server log, not the browser, since they can name internal hosts.
- The browser loads icons from `cdn.jsdelivr.net` and any icon URLs you configure. Those hosts see the viewer's IP address.

## Reporting a vulnerability

Report it privately through [GitHub security advisories](https://github.com/flexdinesh/pin/security/advisories/new). Don't open a public issue.

Include the version (`pin version`), how to reproduce it, and its impact. Expect a reply within a week.

Only the latest release gets fixes.
