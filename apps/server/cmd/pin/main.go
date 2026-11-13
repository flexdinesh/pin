// Command pin serves a bookmark dashboard from one YAML file.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"io/fs"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/flexdinesh/pin/apps/server/internal/config"
	"github.com/flexdinesh/pin/apps/server/internal/server"
	"github.com/flexdinesh/pin/apps/server/internal/webui"
)

const (
	defaultConfigPath = "pin.yaml"
	defaultListen     = ":8080"
	defaultSocketMode = "0660"
	shutdownTimeout   = 10 * time.Second
	usage             = "usage: pin <serve|healthcheck|version> [flags]"
)

// version is set at build time with -ldflags "-X main.version=...".
var version = "dev"

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()
	if err := run(ctx, os.Args[1:], os.Getenv, os.Stdout); err != nil {
		fmt.Fprintln(os.Stderr, "pin:", err)
		stop()
		os.Exit(1)
	}
}

// settings come from flags, then PIN_* env vars, then defaults.
type settings struct {
	config     string
	listen     listenAddr
	basePath   string
	socketMode fs.FileMode
}

type listenAddr struct {
	network string
	address string
}

func run(ctx context.Context, args []string, getenv func(string) string, out io.Writer) error {
	if len(args) == 0 {
		return errors.New(usage)
	}
	command := args[0]
	switch command {
	case "version":
		if len(args) != 1 {
			return errors.New(usage)
		}
		_, err := fmt.Fprintln(out, version)
		return err
	case "serve", "healthcheck":
	default:
		return errors.New(usage)
	}
	parsed, err := parseSettings(command, args[1:], getenv, out)
	if errors.Is(err, flag.ErrHelp) {
		return nil
	}
	if err != nil {
		return err
	}
	if command == "serve" {
		return serve(ctx, parsed, out)
	}
	return healthcheck(ctx, parsed)
}

func parseSettings(command string, args []string, getenv func(string) string, out io.Writer) (settings, error) {
	flags := flag.NewFlagSet("pin "+command, flag.ContinueOnError)
	flags.SetOutput(out)
	configPath := flags.String("config", withDefault(getenv("PIN_CONFIG"), defaultConfigPath), "config file `path` (env PIN_CONFIG)")
	listen := flags.String("listen", withDefault(getenv("PIN_LISTEN"), defaultListen), "`address` as host:port or unix:/path/to.sock (env PIN_LISTEN)")
	basePath := flags.String("base-path", getenv("PIN_BASE_PATH"), "URL `prefix` to serve under, e.g. /pin (env PIN_BASE_PATH)")
	socketMode := flags.String("socket-mode", withDefault(getenv("PIN_SOCKET_MODE"), defaultSocketMode), "octal file `mode` for a unix socket (env PIN_SOCKET_MODE)")
	if err := flags.Parse(args); err != nil {
		return settings{}, err
	}
	if flags.NArg() != 0 {
		return settings{}, errors.New(usage)
	}
	addr, err := parseListen(*listen)
	if err != nil {
		return settings{}, err
	}
	mode, err := parseSocketMode(*socketMode)
	if err != nil {
		return settings{}, err
	}
	return settings{
		config:     *configPath,
		listen:     addr,
		basePath:   server.NormalizeBasePath(*basePath),
		socketMode: mode,
	}, nil
}

func withDefault(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func parseListen(value string) (listenAddr, error) {
	if path, isUnix := strings.CutPrefix(value, "unix:"); isUnix {
		if path == "" {
			return listenAddr{}, fmt.Errorf("invalid listen address %q: missing socket path", value)
		}
		return listenAddr{network: "unix", address: path}, nil
	}
	if _, _, err := net.SplitHostPort(value); err != nil {
		return listenAddr{}, fmt.Errorf("invalid listen address %q: want host:port or unix:/path: %w", value, err)
	}
	return listenAddr{network: "tcp", address: value}, nil
}

func parseSocketMode(value string) (fs.FileMode, error) {
	mode, err := strconv.ParseUint(value, 8, 32)
	if err != nil || mode > 0o777 {
		return 0, fmt.Errorf("invalid socket mode %q: want octal like 0660", value)
	}
	return fs.FileMode(mode), nil
}

func serve(ctx context.Context, s settings, out io.Writer) error {
	cfg, err := config.Load(s.config)
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

	listener, err := listen(s.listen, s.socketMode)
	if err != nil {
		return err
	}
	httpServer := &http.Server{Handler: server.Mount(s.basePath, handler), ReadHeaderTimeout: 5 * time.Second}
	serveErr := make(chan error, 1)
	go func() { serveErr <- httpServer.Serve(listener) }()
	fmt.Fprintf(out, "pin %s: serving %s on %s%s/\n", version, s.config, displayAddr(s.listen, listener), s.basePath)

	select {
	case err := <-serveErr:
		return err
	case <-ctx.Done():
	}
	shutdownCtx, cancel := context.WithTimeout(context.WithoutCancel(ctx), shutdownTimeout)
	defer cancel()
	// Shutdown closes the listener, which also removes a unix socket file.
	return httpServer.Shutdown(shutdownCtx)
}

func displayAddr(addr listenAddr, listener net.Listener) string {
	if addr.network == "unix" {
		return "unix:" + addr.address
	}
	return listener.Addr().String()
}

func listen(addr listenAddr, socketMode fs.FileMode) (net.Listener, error) {
	if addr.network != "unix" {
		return net.Listen(addr.network, addr.address)
	}
	if err := removeStaleSocket(addr.address); err != nil {
		return nil, err
	}
	listener, err := net.Listen("unix", addr.address)
	if err != nil {
		return nil, err
	}
	if err := os.Chmod(addr.address, socketMode); err != nil {
		_ = listener.Close()
		return nil, fmt.Errorf("set socket mode: %w", err)
	}
	return listener, nil
}

// removeStaleSocket clears a socket left by a crashed run. It refuses a socket
// another process still accepts on, and any path that is not a socket.
func removeStaleSocket(path string) error {
	info, err := os.Lstat(path)
	if errors.Is(err, fs.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}
	if info.Mode()&fs.ModeSocket == 0 {
		return fmt.Errorf("%s exists and is not a socket", path)
	}
	if conn, err := net.DialTimeout("unix", path, time.Second); err == nil {
		_ = conn.Close()
		return fmt.Errorf("%s is in use by another process", path)
	}
	return os.Remove(path)
}

func healthcheck(ctx context.Context, s settings) error {
	ctx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()
	client, host, err := healthcheckClient(s.listen)
	if err != nil {
		return err
	}
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, "http://"+host+s.basePath+"/healthz", nil)
	if err != nil {
		return err
	}
	response, err := client.Do(request)
	if err != nil {
		return err
	}
	defer func() { _ = response.Body.Close() }()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("healthz returned %d", response.StatusCode)
	}
	return nil
}

// healthcheckClient reaches the server on loopback, or through its socket.
func healthcheckClient(addr listenAddr) (*http.Client, string, error) {
	if addr.network == "unix" {
		transport := &http.Transport{
			DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
				var dialer net.Dialer
				return dialer.DialContext(ctx, "unix", addr.address)
			},
		}
		return &http.Client{Transport: transport}, "pin", nil
	}
	_, port, err := net.SplitHostPort(addr.address)
	if err != nil {
		return nil, "", err
	}
	return http.DefaultClient, net.JoinHostPort("127.0.0.1", port), nil
}
