package main

import (
	"context"
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func env(values map[string]string) func(string) string {
	return func(key string) string { return values[key] }
}

func TestRunRejectsBadUsage(t *testing.T) {
	for _, args := range [][]string{nil, {"nope"}, {"serve", "extra"}} {
		if err := run(context.Background(), args, env(nil), io.Discard); err == nil {
			t.Errorf("run(%v): want error", args)
		}
	}
}

func TestServeFailsOnMissingConfig(t *testing.T) {
	path := filepath.Join(t.TempDir(), "absent.yaml")
	err := run(context.Background(), []string{"serve"}, env(map[string]string{"PIN_CONFIG": path}), io.Discard)
	if err == nil || !strings.Contains(err.Error(), "absent.yaml") {
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

func TestHealthcheckFailsWhenNothingListens(t *testing.T) {
	err := run(context.Background(), []string{"healthcheck"}, env(map[string]string{"PIN_ADDR": "127.0.0.1:1"}), io.Discard)
	if err == nil {
		t.Error("want error")
	}
}

func TestHealthcheckRejectsBadAddr(t *testing.T) {
	err := run(context.Background(), []string{"healthcheck"}, env(map[string]string{"PIN_ADDR": "nope"}), io.Discard)
	if err == nil || !strings.Contains(err.Error(), "PIN_ADDR") {
		t.Errorf("err = %v", err)
	}
}
