# Deployment

pin is one process that serves the web app, its config and widget data. It logs to stdout and stderr, stores nothing on disk, and answers `GET /healthz` with `200 ok`.

## Docker

```sh
docker run -d --name pin --restart unless-stopped -p 8080:8080 \
  -v "$PWD/pin.yaml:/config/pin.yaml:ro" \
  ghcr.io/flexdinesh/pin:latest
```

Images are built for `linux/amd64` and `linux/arm64`. They run as a non-root user and include a `HEALTHCHECK`.

| Tag | Tracks |
| --- | --- |
| `latest` | Newest release. |
| `0.1.0` | That exact release. |
| `0.1` | Newest patch of 0.1. |

Pin a version tag in production. To upgrade, pull the new tag and recreate the container.

## Docker Compose

Download [`compose.yaml`](../compose.yaml) next to your `pin.yaml`, then:

```sh
docker compose up -d
docker compose restart pin   # after editing pin.yaml
```

`PIN_CONFIG_FILE` sets a different config path. `PIN_PORT` sets a different host port.

## Binary

Download an archive for your OS and architecture from [Releases](https://github.com/flexdinesh/pin/releases). Builds exist for Linux, macOS and Windows on amd64 and arm64.

```sh
tar xzf pin_*_linux_amd64.tar.gz
./pin serve --config ./pin.yaml --listen 127.0.0.1:8080
```

### systemd

`/etc/systemd/system/pin.service`:

```ini
[Unit]
Description=pin bookmark dashboard
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/pin serve
Environment=PIN_CONFIG=/etc/pin/pin.yaml
Environment=PIN_LISTEN=127.0.0.1:8080
DynamicUser=yes
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

```sh
sudo systemctl enable --now pin
sudo systemctl restart pin   # after editing pin.yaml
```

## Kubernetes

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: pin
data:
  pin.yaml: |
    title: Home
    bookmarks:
      - name: Grafana
        url: https://grafana.example.com
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pin
spec:
  replicas: 1
  selector:
    matchLabels: { app: pin }
  template:
    metadata:
      labels: { app: pin }
    spec:
      containers:
        - name: pin
          image: ghcr.io/flexdinesh/pin:0.1.0
          ports:
            - containerPort: 8080
          readinessProbe:
            httpGet: { path: /healthz, port: 8080 }
          livenessProbe:
            httpGet: { path: /healthz, port: 8080 }
          volumeMounts:
            - name: config
              mountPath: /config
              readOnly: true
      volumes:
        - name: config
          configMap:
            name: pin
---
apiVersion: v1
kind: Service
metadata:
  name: pin
spec:
  selector: { app: pin }
  ports:
    - port: 80
      targetPort: 8080
```

pin does not watch the file, so restart the Deployment after changing the ConfigMap: `kubectl rollout restart deployment/pin`.

## Reverse proxy

### Caddy

```caddyfile
pin.example.com {
	reverse_proxy 127.0.0.1:8080
}
```

### nginx

```nginx
server {
    listen 443 ssl;
    server_name pin.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
    }
}
```

## Unix socket

Listen on a socket instead of a TCP port:

```sh
pin serve --listen unix:/run/pin/pin.sock
```

- The socket is created with mode `0660`. The proxy's user must be in pin's group, or set `--socket-mode 0666`.
- A leftover socket from a crashed run is replaced. pin refuses to start if another process is using the socket, or if the path is not a socket.
- pin removes the socket on shutdown.

Caddy:

```caddyfile
pin.example.com {
	reverse_proxy unix//run/pin/pin.sock
}
```

nginx:

```nginx
location / {
    proxy_pass http://unix:/run/pin/pin.sock;
}
```

## Subpath

pin can run under a prefix such as `https://example.com/pin/`. The web app uses relative URLs, so there are two ways to set this up.

**Proxy strips the prefix** (no pin config needed):

```caddyfile
example.com {
	redir /pin /pin/
	handle_path /pin/* {
		reverse_proxy 127.0.0.1:8080
	}
}
```

**Proxy keeps the prefix**: set `PIN_BASE_PATH=/pin`. pin then serves everything under `/pin/`, redirects `/pin` to `/pin/`, and returns 404 elsewhere. Health checks move to `/pin/healthz`.

```caddyfile
example.com {
	reverse_proxy /pin* 127.0.0.1:8080
}
```

The page must load with a trailing slash (`/pin/`). Without it, relative URLs resolve against `/` and requests 404. When the proxy strips the prefix, make it redirect `/pin` to `/pin/`, as above.

## HTTPS

pin serves plain HTTP. Put it behind a proxy for HTTPS. Browsers only offer to install the app over HTTPS or on `localhost`.
