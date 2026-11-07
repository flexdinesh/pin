package widget

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
)

func serveGatus(t *testing.T, status int, body string) (*httptest.Server, *string) {
	t.Helper()
	var requested string
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requested = r.URL.RequestURI()
		w.WriteHeader(status)
		_, _ = w.Write([]byte(body))
	}))
	t.Cleanup(server.Close)
	return server, &requested
}

func TestFetchGatusCountsLatestResults(t *testing.T) {
	server, requested := serveGatus(t, http.StatusOK, `[
		{"key":"a","results":[{"success":true}]},
		{"key":"b","results":[{"success":true,"status":200,"duration":12}]},
		{"key":"c","results":[{"success":false}]},
		{"key":"d","results":[{"success":false},{"success":true}]},
		{"key":"e","results":[{"success":true},{"success":false}]},
		{"key":"f","results":[]},
		{"key":"g"}
	]`)

	got, err := Fetch(context.Background(), TypeGatus, server.URL)
	if err != nil {
		t.Fatal(err)
	}
	if want := (Status{Up: 3, Down: 2}); got != want {
		t.Errorf("status = %+v, want %+v", got, want)
	}
	if *requested != "/api/v1/endpoints/statuses?pageSize=1" {
		t.Errorf("requested %q", *requested)
	}
}

func TestFetchGatusKeepsBasePath(t *testing.T) {
	server, requested := serveGatus(t, http.StatusOK, `[]`)
	if _, err := Fetch(context.Background(), TypeGatus, server.URL+"/status/?x=1#top"); err != nil {
		t.Fatal(err)
	}
	if *requested != "/status/api/v1/endpoints/statuses?pageSize=1" {
		t.Errorf("requested %q", *requested)
	}
}

func TestFetchFailures(t *testing.T) {
	cases := []struct {
		name   string
		status int
		body   string
	}{
		{"protected", http.StatusUnauthorized, `{"error":"unauthorized"}`},
		{"server error", http.StatusInternalServerError, ``},
		{"login page", http.StatusOK, `<!doctype html><title>Sign in</title>`},
		{"wrong shape", http.StatusOK, `{"results":[]}`},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			server, _ := serveGatus(t, tc.status, tc.body)
			if _, err := Fetch(context.Background(), TypeGatus, server.URL); err == nil {
				t.Fatal("want error")
			}
		})
	}
}

func TestFetchStopsWithItsContext(t *testing.T) {
	server, _ := serveGatus(t, http.StatusOK, `[]`)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := Fetch(ctx, TypeGatus, server.URL); err == nil {
		t.Fatal("want error")
	}
}

func TestFetchRejectsUnknownType(t *testing.T) {
	if _, err := Fetch(context.Background(), "nope", "http://localhost"); err == nil {
		t.Fatal("want error")
	}
}
