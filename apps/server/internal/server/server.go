// Package server serves the web app and its config over HTTP.
package server

import (
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"path"
	"strings"

	"github.com/flexdinesh/pin/apps/server/internal/config"
	"github.com/flexdinesh/pin/apps/server/internal/widget"
)

const (
	cacheNever     = "no-cache"
	cacheImmutable = "public, max-age=31536000, immutable"
)

const appColor = "#21252b"

type manifestIcon struct {
	Src     string `json:"src"`
	Sizes   string `json:"sizes"`
	Type    string `json:"type"`
	Purpose string `json:"purpose,omitempty"`
}

type manifest struct {
	ID              string         `json:"id"`
	Name            string         `json:"name"`
	ShortName       string         `json:"short_name"`
	StartURL        string         `json:"start_url"`
	Scope           string         `json:"scope"`
	Display         string         `json:"display"`
	BackgroundColor string         `json:"background_color"`
	ThemeColor      string         `json:"theme_color"`
	Icons           []manifestIcon `json:"icons"`
}

// newManifest uses URLs relative to the manifest, so the app installs under any
// base path.
func newManifest(title string) manifest {
	return manifest{
		ID:              "./",
		Name:            title,
		ShortName:       "pin",
		StartURL:        "./",
		Scope:           "./",
		Display:         "standalone",
		BackgroundColor: appColor,
		ThemeColor:      appColor,
		Icons: []manifestIcon{
			{Src: "icons/icon-192.png", Sizes: "192x192", Type: "image/png"},
			{Src: "icons/icon-512.png", Sizes: "512x512", Type: "image/png"},
			{Src: "icons/icon-maskable-512.png", Sizes: "512x512", Type: "image/png", Purpose: "maskable"},
		},
	}
}

// NormalizeBasePath returns a URL prefix with a leading slash and no trailing
// slash, or "" for the root.
func NormalizeBasePath(value string) string {
	trimmed := strings.Trim(strings.TrimSpace(value), "/")
	if trimmed == "" {
		return ""
	}
	return path.Clean("/" + trimmed)
}

// Mount serves handler under basePath, as returned by NormalizeBasePath. The
// bare prefix redirects to its trailing-slash form, which the web app's
// relative URLs resolve against.
func Mount(basePath string, handler http.Handler) http.Handler {
	if basePath == "" {
		return handler
	}
	stripped := http.StripPrefix(basePath, handler)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.URL.Path == basePath:
			target := basePath + "/"
			if r.URL.RawQuery != "" {
				target += "?" + r.URL.RawQuery
			}
			http.Redirect(w, r, target, http.StatusMovedPermanently)
		case strings.HasPrefix(r.URL.Path, basePath+"/"):
			stripped.ServeHTTP(w, r)
		default:
			http.NotFound(w, r)
		}
	})
}

// New returns the handler. assets must hold index.html, assets/* and icons/*.
func New(cfg config.Config, assets fs.FS) (http.Handler, error) {
	index, err := fs.ReadFile(assets, "index.html")
	if err != nil {
		return nil, fmt.Errorf("web app is not built: %w", err)
	}
	encoded, err := json.Marshal(cfg)
	if err != nil {
		return nil, fmt.Errorf("encode config: %w", err)
	}
	encodedManifest, err := json.Marshal(newManifest(cfg.Title))
	if err != nil {
		return nil, fmt.Errorf("encode manifest: %w", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", respond("text/html; charset=utf-8", index))
	mux.HandleFunc("GET /api/config", respond("application/json", encoded))
	mux.HandleFunc("GET /api/widgets/{id}", serveWidget(cfg.Widgets()))
	mux.HandleFunc("GET /manifest.webmanifest", respond("application/manifest+json", encodedManifest))
	mux.HandleFunc("GET /healthz", respond("text/plain; charset=utf-8", []byte("ok\n")))

	files := http.FileServerFS(assets)
	mux.HandleFunc("GET /icons/", func(w http.ResponseWriter, r *http.Request) {
		// Unhashed names, so a replaced icon must not stay cached.
		w.Header().Set("Cache-Control", cacheNever)
		files.ServeHTTP(w, r)
	})
	mux.HandleFunc("GET /assets/", func(w http.ResponseWriter, r *http.Request) {
		// Vite hashes these names, so a response never goes stale. Set before
		// serving; only success responses are cacheable by default.
		w.Header().Set("Cache-Control", cacheImmutable)
		files.ServeHTTP(w, r)
	})
	return mux, nil
}

// serveWidget reads only configured URLs. The browser picks a widget, never an address.
func serveWidget(widgets []*config.Widget) http.HandlerFunc {
	byID := make(map[string]*config.Widget, len(widgets))
	for _, configured := range widgets {
		byID[configured.ID] = configured
	}
	return func(w http.ResponseWriter, r *http.Request) {
		id := r.PathValue("id")
		configured, known := byID[id]
		if !known {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Cache-Control", cacheNever)
		status, err := widget.Fetch(r.Context(), configured.Type, configured.URL)
		if err != nil {
			// The cause can name internal addresses, so it stays in the server log.
			log.Printf("widget %s: %v", id, err)
			http.Error(w, "widget unavailable", http.StatusBadGateway)
			return
		}
		body, err := json.Marshal(status)
		if err != nil {
			http.Error(w, "widget unavailable", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_, _ = w.Write(body)
	}
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
