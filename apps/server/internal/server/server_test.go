package server

import (
	"encoding/json"
	"io/fs"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"testing/fstest"

	"github.com/flexdinesh/pin/apps/server/internal/config"
	"github.com/flexdinesh/pin/apps/server/internal/webui"
)

func fixtureAssets() fstest.MapFS {
	return fstest.MapFS{
		"index.html":       {Data: []byte("<!doctype html><title>pin</title>")},
		"assets/app-1.js":  {Data: []byte("console.log(1)")},
		"assets/app-1.css": {Data: []byte("body{}")},
	}
}

func newHandler(t *testing.T, assets fs.FS) http.Handler {
	t.Helper()
	cfg, err := config.Parse([]byte("title: Lab\nbookmarks:\n  - {name: A, url: 'https://a.test', group: G, icon: grafana}\n"))
	if err != nil {
		t.Fatal(err)
	}
	handler, err := New(cfg, assets)
	if err != nil {
		t.Fatal(err)
	}
	return handler
}

func get(handler http.Handler, method, path string) *httptest.ResponseRecorder {
	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, httptest.NewRequest(method, path, nil))
	return recorder
}

func TestRoutes(t *testing.T) {
	handler := newHandler(t, fixtureAssets())
	cases := []struct {
		path        string
		status      int
		contentType string
		cache       string
	}{
		{"/", 200, "text/html; charset=utf-8", "no-cache"},
		{"/api/config", 200, "application/json", "no-cache"},
		{"/healthz", 200, "text/plain; charset=utf-8", "no-cache"},
		{"/assets/app-1.js", 200, "text/javascript; charset=utf-8", "public, max-age=31536000, immutable"},
		{"/assets/app-1.css", 200, "text/css; charset=utf-8", "public, max-age=31536000, immutable"},
		{"/assets/missing.js", 404, "", ""},
		{"/index.html", 404, "", ""},
		{"/missing", 404, "", ""},
		{"/api/other", 404, "", ""},
	}
	for _, tc := range cases {
		t.Run(tc.path, func(t *testing.T) {
			response := get(handler, http.MethodGet, tc.path)
			if response.Code != tc.status {
				t.Fatalf("status = %d, want %d", response.Code, tc.status)
			}
			if tc.status != 200 {
				return
			}
			if got := response.Header().Get("Content-Type"); got != tc.contentType {
				t.Errorf("content type = %q, want %q", got, tc.contentType)
			}
			if got := response.Header().Get("Cache-Control"); got != tc.cache {
				t.Errorf("cache = %q, want %q", got, tc.cache)
			}
		})
	}
}

func TestConfigResponseIsGroupedWithResolvedIcons(t *testing.T) {
	response := get(newHandler(t, fixtureAssets()), http.MethodGet, "/api/config")
	var body struct {
		Title  string `json:"title"`
		Groups []struct {
			Name      string `json:"name"`
			Bookmarks []struct {
				Name string `json:"name"`
				URL  string `json:"url"`
				Icon struct {
					Kind string `json:"kind"`
					Src  string `json:"src"`
				} `json:"icon"`
			} `json:"bookmarks"`
		} `json:"groups"`
	}
	if err := json.Unmarshal(response.Body.Bytes(), &body); err != nil {
		t.Fatal(err)
	}
	if body.Title != "Lab" || len(body.Groups) != 1 || body.Groups[0].Name != "G" {
		t.Fatalf("body = %+v", body)
	}
	bookmark := body.Groups[0].Bookmarks[0]
	if bookmark.URL != "https://a.test" || bookmark.Icon.Kind != "image" || !strings.HasSuffix(bookmark.Icon.Src, "/png/grafana.png") {
		t.Errorf("bookmark = %+v", bookmark)
	}
}

func TestRejectsWrites(t *testing.T) {
	if got := get(newHandler(t, fixtureAssets()), http.MethodPost, "/api/config").Code; got != http.StatusMethodNotAllowed {
		t.Errorf("status = %d", got)
	}
}

func TestHeadHasNoBody(t *testing.T) {
	response := get(newHandler(t, fixtureAssets()), http.MethodHead, "/healthz")
	if response.Code != 200 || response.Body.Len() != 0 {
		t.Errorf("status = %d, body = %q", response.Code, response.Body.String())
	}
}

func TestNewFailsWithoutBuiltWebApp(t *testing.T) {
	if _, err := New(config.Config{}, fstest.MapFS{}); err == nil {
		t.Error("want error")
	}
}

// Runs against the real embedded build. `mise run test` builds it first; a
// bare `go test` before any web build has nothing to check.
func TestEmbeddedWebApp(t *testing.T) {
	assets, err := webui.Assets()
	if err != nil {
		t.Fatal(err)
	}
	if _, err := fs.Stat(assets, "index.html"); err != nil {
		t.Skip("web app not built; run mise run test")
	}
	handler := newHandler(t, assets)

	page := get(handler, http.MethodGet, "/")
	if page.Code != 200 || !strings.Contains(page.Body.String(), `href="/api/config"`) {
		t.Fatalf("index: status %d, missing config preload", page.Code)
	}

	entries, err := fs.ReadDir(assets, "assets")
	if err != nil || len(entries) == 0 {
		t.Fatalf("assets: %v, %d entries", err, len(entries))
	}
	for _, entry := range entries {
		path := "/assets/" + entry.Name()
		if !strings.Contains(page.Body.String(), path) {
			continue
		}
		response := get(handler, http.MethodGet, path)
		if response.Code != 200 || response.Header().Get("Cache-Control") != cacheImmutable {
			t.Errorf("%s: status %d, cache %q", path, response.Code, response.Header().Get("Cache-Control"))
		}
	}
}
