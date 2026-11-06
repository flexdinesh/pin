// Command pin serves a bookmark dashboard from one YAML file.
package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/flexdinesh/pin/apps/server/internal/config"
	"github.com/flexdinesh/pin/apps/server/internal/server"
	"github.com/flexdinesh/pin/apps/server/internal/webui"
)

const (
	defaultConfigPath = "/config/pin.yaml"
	defaultAddr       = ":8080"
	shutdownTimeout   = 10 * time.Second
	usage             = "usage: pin <serve|healthcheck>"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx, os.Args[1:], os.Getenv, os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, "pin:", err)
		stop()
		os.Exit(1)
	}
}

func run(ctx context.Context, args []string, getenv func(string) string, out io.Writer) error {
	if len(args) != 1 {
		return errors.New(usage)
	}
	addr := withDefault(getenv("PIN_ADDR"), defaultAddr)
	switch args[0] {
	case "serve":
		return serve(ctx, addr, withDefault(getenv("PIN_CONFIG"), defaultConfigPath), out)
	case "healthcheck":
		return healthcheck(ctx, addr)
	default:
		return errors.New(usage)
	}
}

func withDefault(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func serve(ctx context.Context, addr, configPath string, out io.Writer) error {
	cfg, err := config.Load(configPath)
	if err != nil {
		return err
	}
	assets, err := webui.Assets()
	if err != nil {
		return err
	}
	handler, err := server.New(cfg, assets)
	if err != nil {
		return err
	}

	listener, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}
	httpServer := &http.Server{Handler: handler, ReadHeaderTimeout: 5 * time.Second}
	serveErr := make(chan error, 1)
	go func() { serveErr <- httpServer.Serve(listener) }()
	fmt.Fprintf(out, "pin: serving %s on %s\n", configPath, listener.Addr())

	select {
	case err := <-serveErr:
		return err
	case <-ctx.Done():
	}
	shutdownCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), shutdownTimeout)
	defer cancel()
	return httpServer.Shutdown(shutdownCtx)
}

func healthcheck(ctx context.Context, addr string) error {
	_, port, err := net.SplitHostPort(addr)
	if err != nil {
		return fmt.Errorf("invalid PIN_ADDR %q: %w", addr, err)
	}
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, "http://"+net.JoinHostPort("127.0.0.1", strings.TrimSpace(port))+"/healthz", nil)
	if err != nil {
		return err
	}
	response, err := http.DefaultClient.Do(request)
	if err != nil {
		return err
	}
	defer func() { _ = response.Body.Close() }()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("healthz returned %d", response.StatusCode)
	}
	return nil
}
