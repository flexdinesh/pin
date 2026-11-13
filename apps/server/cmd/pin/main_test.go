package main

import (
	"bytes"
	"context"
	"io"
	"io/fs"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"github.com/flexdinesh/pin/apps/server/internal/webui"
)

func env(values map[string]string) func(string) string {
	return func(key string) string { return values[key] }
}

func writeConfig(t *testing.T) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "pin.yaml")
	if err := os.WriteFile(path, []byte("bookmarks:\n  - {name: A, url: 'https://a.test'}\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	return path
}

// socketPath stays short: unix socket paths are limited to about 100 bytes.
func socketPath(t *testing.T) string {
	t.Helper()
	dir, err := os.MkdirTemp("", "pin")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = os.RemoveAll(dir) })
	return filepath.Join(dir, "pin.sock")
}

func TestRunRejectsBadUsage(t *testing.T) {
	for _, args := range [][]string{nil, {"nope"}, {"serve", "extra"}, {"version", "extra"}, {"serve", "--nope"}} {
		if err := run(context.Background(), args, env(nil), io.Discard); err == nil {
			t.Errorf("run(%v): want error", args)
		}
	}
}

func TestHelpIsNotAnError(t *testing.T) {
	var out bytes.Buffer
	if err := run(context.Background(), []string{"serve", "-h"}, env(nil), &out); err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(out.String(), "-listen") {
		t.Errorf("help = %q", out.String())
	}
}

func TestVersion(t *testing.T) {
	var out bytes.Buffer
	if err := run(context.Background(), []string{"version"}, env(nil), &out); err != nil {
		t.Fatal(err)
	}
	if out.String() != version+"\n" {
		t.Errorf("out = %q", out.String())
	}
}

func TestServeFailsOnMissingConfig(t *testing.T) {
	path := filepath.Join(t.TempDir(), "absent.yaml")
	err := run(context.Background(), []string{"serve"}, env(map[string]string{"PIN_CONFIG": path}), io.Discard)
	if err == nil || !strings.Contains(err.Error(), "absent.yaml") {
		t.Errorf("err = %v", err)
	}
}

func TestServeDefaultsToConfigInWorkingDir(t *testing.T) {
	t.Chdir(t.TempDir())
	err := run(context.Background(), []string{"serve"}, env(nil), io.Discard)
	if err == nil || !strings.Contains(err.Error(), "pin.yaml") {
		t.Errorf("err = %v", err)
	}
}

func TestServeFailsOnInvalidConfig(t *testing.T) {
	path := filepath.Join(t.TempDir(), "pin.yaml")
	if err := os.WriteFile(path, []byte("bookmarks:\n  - {name: A, href: 'https://a.test'}\n"), 0o600); err != nil {
		t.Fatal(err)
	}
	err := run(context.Background(), []string{"serve"}, env(map[string]string{"PIN_CONFIG": path}), io.Discard)
	if err == nil || !strings.Contains(err.Error(), "bookmarks[0]") || !strings.Contains(err.Error(), "href") {
		t.Errorf("err = %v", err)
	}
}

func TestSettingsPrecedence(t *testing.T) {
	defaults, err := parseSettings("serve", nil, env(nil), io.Discard)
	if err != nil {
		t.Fatal(err)
	}
	if defaults.config != "pin.yaml" || defaults.listen != (listenAddr{"tcp", ":8080"}) || defaults.basePath != "" || defaults.socketMode != 0o660 {
		t.Errorf("defaults = %+v", defaults)
	}

	fromEnv := env(map[string]string{
		"PIN_CONFIG":      "/etc/pin.yaml",
		"PIN_LISTEN":      "unix:/run/pin.sock",
		"PIN_BASE_PATH":   "pin/",
		"PIN_SOCKET_MODE": "600",
	})
	envOnly, err := parseSettings("serve", nil, fromEnv, io.Discard)
	if err != nil {
		t.Fatal(err)
	}
	if envOnly.config != "/etc/pin.yaml" || envOnly.listen != (listenAddr{"unix", "/run/pin.sock"}) || envOnly.basePath != "/pin" || envOnly.socketMode != 0o600 {
		t.Errorf("env = %+v", envOnly)
	}

	flags := []string{"--config", "a.yaml", "--listen", "127.0.0.1:9000", "--base-path", "/dash", "--socket-mode", "0666"}
	overridden, err := parseSettings("serve", flags, fromEnv, io.Discard)
	if err != nil {
		t.Fatal(err)
	}
	if overridden.config != "a.yaml" || overridden.listen != (listenAddr{"tcp", "127.0.0.1:9000"}) || overridden.basePath != "/dash" || overridden.socketMode != 0o666 {
		t.Errorf("flags = %+v", overridden)
	}
}

func TestParseListen(t *testing.T) {
	valid := map[string]listenAddr{
		":8080":              {"tcp", ":8080"},
		"0.0.0.0:80":         {"tcp", "0.0.0.0:80"},
		"[::1]:8080":         {"tcp", "[::1]:8080"},
		"unix:/run/pin.sock": {"unix", "/run/pin.sock"},
		"unix:pin.sock":      {"unix", "pin.sock"},
	}
	for input, want := range valid {
		got, err := parseListen(input)
		if err != nil || got != want {
			t.Errorf("parseListen(%q) = %+v, %v", input, got, err)
		}
	}
	for _, input := range []string{"", "8080", "nope", "unix:"} {
		if _, err := parseListen(input); err == nil {
			t.Errorf("parseListen(%q): want error", input)
		}
	}
}

func TestParseSocketMode(t *testing.T) {
	for input, want := range map[string]fs.FileMode{"0660": 0o660, "600": 0o600, "0777": 0o777} {
		if got, err := parseSocketMode(input); err != nil || got != want {
			t.Errorf("parseSocketMode(%q) = %v, %v", input, got, err)
		}
	}
	for _, input := range []string{"", "rw", "0999", "1777", "-1"} {
		if _, err := parseSocketMode(input); err == nil {
			t.Errorf("parseSocketMode(%q): want error", input)
		}
	}
}

func TestHealthcheckFailsWhenNothingListens(t *testing.T) {
	for _, listen := range []string{"127.0.0.1:1", "unix:" + filepath.Join(t.TempDir(), "absent.sock")} {
		if err := run(context.Background(), []string{"healthcheck"}, env(map[string]string{"PIN_LISTEN": listen}), io.Discard); err == nil {
			t.Errorf("%s: want error", listen)
		}
	}
}

func TestHealthcheckRejectsBadListen(t *testing.T) {
	err := run(context.Background(), []string{"healthcheck"}, env(map[string]string{"PIN_LISTEN": "nope"}), io.Discard)
	if err == nil || !strings.Contains(err.Error(), "listen address") {
		t.Errorf("err = %v", err)
	}
}

func TestServeOnUnixSocketUnderBasePath(t *testing.T) {
	assets, err := webui.Assets()
	if err != nil {
		t.Fatal(err)
	}
	if _, err := fs.Stat(assets, "index.html"); err != nil {
		t.Skip("web app not built; run mise run test")
	}
	socket := socketPath(t)
	values := map[string]string{
		"PIN_CONFIG":      writeConfig(t),
		"PIN_LISTEN":      "unix:" + socket,
		"PIN_BASE_PATH":   "/pin",
		"PIN_SOCKET_MODE": "0600",
	}
	ctx, cancel := context.WithCancel(context.Background())
	done := make(chan error, 1)
	go func() { done <- run(ctx, []string{"serve"}, env(values), io.Discard) }()

	healthy := false
	for range 100 {
		if run(context.Background(), []string{"healthcheck"}, env(values), io.Discard) == nil {
			healthy = true
			break
		}
		time.Sleep(20 * time.Millisecond)
	}
	if !healthy {
		cancel()
		t.Fatalf("never healthy: %v", <-done)
	}
	info, err := os.Stat(socket)
	if err != nil {
		t.Fatal(err)
	}
	if info.Mode().Perm() != 0o600 {
		t.Errorf("mode = %v", info.Mode().Perm())
	}
	rootOnly := map[string]string{"PIN_LISTEN": values["PIN_LISTEN"]}
	if err := run(context.Background(), []string{"healthcheck"}, env(rootOnly), io.Discard); err == nil {
		t.Error("healthcheck without base path: want error")
	}

	cancel()
	if err := <-done; err != nil {
		t.Fatalf("serve: %v", err)
	}
	if _, err := os.Lstat(socket); !os.IsNotExist(err) {
		t.Errorf("socket left behind: %v", err)
	}
}

func TestListenReplacesStaleSocket(t *testing.T) {
	socket := socketPath(t)
	stale, err := net.Listen("unix", socket)
	if err != nil {
		t.Fatal(err)
	}
	unixListener, isUnix := stale.(*net.UnixListener)
	if !isUnix {
		t.Fatalf("listener is %T", stale)
	}
	unixListener.SetUnlinkOnClose(false)
	_ = stale.Close()

	listener, err := listen(listenAddr{"unix", socket}, 0o660)
	if err != nil {
		t.Fatal(err)
	}
	_ = listener.Close()
}

func TestListenRefusesSocketInUse(t *testing.T) {
	socket := socketPath(t)
	active, err := net.Listen("unix", socket)
	if err != nil {
		t.Fatal(err)
	}
	defer func() { _ = active.Close() }()
	if _, err := listen(listenAddr{"unix", socket}, 0o660); err == nil || !strings.Contains(err.Error(), "in use") {
		t.Errorf("err = %v", err)
	}
}

func TestListenRefusesNonSocket(t *testing.T) {
	path := filepath.Join(t.TempDir(), "pin.sock")
	if err := os.WriteFile(path, []byte("keep"), 0o600); err != nil {
		t.Fatal(err)
	}
	if _, err := listen(listenAddr{"unix", path}, 0o660); err == nil || !strings.Contains(err.Error(), "not a socket") {
		t.Errorf("err = %v", err)
	}
	if data, err := os.ReadFile(path); err != nil || string(data) != "keep" {
		t.Errorf("file changed: %q, %v", data, err)
	}
}
