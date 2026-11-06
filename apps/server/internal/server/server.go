// Package server serves the web app and its config over HTTP.
package server

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"

	"github.com/flexdinesh/pin/apps/server/internal/config"
)

const (
	cacheNever     = "no-cache"
	cacheImmutable = "public, max-age=31536000, immutable"
)

// New returns the handler. assets must hold index.html and assets/*.
func New(cfg config.Config, assets fs.FS) (http.Handler, error) {
	index, err := fs.ReadFile(assets, "index.html")
	if err != nil {
		return nil, fmt.Errorf("web app is not built: %w", err)
	}
	encoded, err := json.Marshal(cfg)
	if err != nil {
		return nil, fmt.Errorf("encode config: %w", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", respond("text/html; charset=utf-8", index))
	mux.HandleFunc("GET /api/config", respond("application/json", encoded))
	mux.HandleFunc("GET /healthz", respond("text/plain; charset=utf-8", []byte("ok\n")))

	files := http.FileServerFS(assets)
	mux.HandleFunc("GET /assets/", func(w http.ResponseWriter, r *http.Request) {
		// Vite hashes these names, so a response never goes stale. Set before
		// serving; only success responses are cacheable by default.
		w.Header().Set("Cache-Control", cacheImmutable)
		files.ServeHTTP(w, r)
	})
	return mux, nil
}

func respond(contentType string, body []byte) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", contentType)
		w.Header().Set("Cache-Control", cacheNever)
		if r.Method != http.MethodHead {
			_, _ = w.Write(body)
		}
	}
}
