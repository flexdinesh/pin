# --- web: build the app into apps/server/internal/webui/dist ---
# Build stages run on the builder's platform; Go cross-compiles for the target.
FROM --platform=$BUILDPLATFORM node:26-alpine AS web
RUN npm install -g pnpm@12.18.0
WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/
RUN pnpm install --frozen-lockfile
COPY apps/web/ apps/web/
RUN pnpm -C apps/web build

# --- server: static, CGO-free binary with the app embedded ---
FROM --platform=$BUILDPLATFORM golang:1.27.3-alpine AS server
WORKDIR /src/apps/server
COPY apps/server/go.mod apps/server/go.sum ./
RUN go mod download
COPY apps/server/ ./
COPY --from=web /src/apps/server/internal/webui/dist/ internal/webui/dist/
ARG TARGETOS TARGETARCH VERSION=dev
RUN CGO_ENABLED=0 GOOS=$TARGETOS GOARCH=$TARGETARCH \
  go build -trimpath -ldflags "-s -w -X main.version=${VERSION}" -o /out/pin ./cmd/pin

# --- runtime ---
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=server /out/pin /usr/local/bin/pin
ENV PIN_LISTEN=:8080 PIN_CONFIG=/config/pin.yaml
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s CMD ["/usr/local/bin/pin", "healthcheck"]
ENTRYPOINT ["/usr/local/bin/pin"]
CMD ["serve"]
