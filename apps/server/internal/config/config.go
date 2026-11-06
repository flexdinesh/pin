// Package config loads and validates a pin YAML file into the grouped form
// served to the web app.
package config

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"net/url"
	"os"
	"strings"

	"go.yaml.in/yaml/v3"

	"github.com/flexdinesh/pin/apps/server/internal/icon"
)

const defaultTitle = "pin"

// Config is a validated dashboard.
type Config struct {
	Title  string  `json:"title"`
	Groups []Group `json:"groups"`
}

// Group holds bookmarks. An empty Name is the ungrouped set, always last.
type Group struct {
	Name      string     `json:"name"`
	Bookmarks []Bookmark `json:"bookmarks"`
}

// Bookmark is one link.
type Bookmark struct {
	Name        string     `json:"name"`
	URL         string     `json:"url"`
	Description string     `json:"description,omitempty"`
	Icon        *icon.Icon `json:"icon,omitempty"`
}

// Load reads and parses the file at path.
func Load(path string) (Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return Config{}, fmt.Errorf("read config: %w", err)
	}
	cfg, err := Parse(data)
	if err != nil {
		return Config{}, fmt.Errorf("invalid config %s:\n%w", path, err)
	}
	return cfg, nil
}

// Parse validates YAML, reporting every invalid entry together. Entries are
// walked as nodes because strict struct decoding stops at type errors without
// saying which entry they belong to.
func Parse(data []byte) (Config, error) {
	var raw struct {
		Title     string      `yaml:"title"`
		Bookmarks []yaml.Node `yaml:"bookmarks"`
	}
	decoder := yaml.NewDecoder(bytes.NewReader(data))
	decoder.KnownFields(true)
	if err := decoder.Decode(&raw); err != nil && !errors.Is(err, io.EOF) {
		return Config{}, err
	}

	var (
		errs      []error
		order     []string
		grouped   = map[string][]Bookmark{}
		ungrouped []Bookmark
	)
	for i := range raw.Bookmarks {
		group, bookmark, err := parseEntry(&raw.Bookmarks[i])
		if err != nil {
			errs = append(errs, fmt.Errorf("bookmarks[%d]: %w", i, err))
			continue
		}
		if group == "" {
			ungrouped = append(ungrouped, bookmark)
			continue
		}
		if _, seen := grouped[group]; !seen {
			order = append(order, group)
		}
		grouped[group] = append(grouped[group], bookmark)
	}
	if err := errors.Join(errs...); err != nil {
		return Config{}, err
	}

	cfg := Config{Title: strings.TrimSpace(raw.Title), Groups: []Group{}}
	if cfg.Title == "" {
		cfg.Title = defaultTitle
	}
	for _, name := range order {
		cfg.Groups = append(cfg.Groups, Group{Name: name, Bookmarks: grouped[name]})
	}
	if len(ungrouped) > 0 {
		cfg.Groups = append(cfg.Groups, Group{Bookmarks: ungrouped})
	}
	return cfg, nil
}

func parseEntry(node *yaml.Node) (string, Bookmark, error) {
	node = resolve(node)
	if node.Kind != yaml.MappingNode {
		return "", Bookmark{}, errors.New("must be a mapping")
	}

	var (
		errs          []error
		group, rawURL string
		rawIcon       string
		bookmark      Bookmark
		seen          = map[string]bool{}
	)
	for i := 0; i+1 < len(node.Content); i += 2 {
		key := node.Content[i].Value
		if seen[key] {
			errs = append(errs, fmt.Errorf("duplicate key %q", key))
			continue
		}
		seen[key] = true

		value, err := scalar(node.Content[i+1])
		if err != nil {
			errs = append(errs, fmt.Errorf("%s: %w", key, err))
			continue
		}
		switch key {
		case "name":
			bookmark.Name = value
		case "url":
			rawURL = value
		case "group":
			group = value
		case "icon":
			rawIcon = value
		case "description":
			bookmark.Description = value
		default:
			errs = append(errs, fmt.Errorf("unknown key %q", key))
		}
	}

	if bookmark.Name == "" {
		errs = append(errs, errors.New("name is required"))
	}
	if err := validateURL(rawURL); err != nil {
		errs = append(errs, err)
	}
	bookmark.URL = rawURL
	if rawIcon != "" {
		parsed, err := icon.Parse(rawIcon)
		if err != nil {
			errs = append(errs, fmt.Errorf("icon: %w", err))
		}
		bookmark.Icon = &parsed
	}
	if err := errors.Join(errs...); err != nil {
		return "", Bookmark{}, err
	}
	return group, bookmark, nil
}

func resolve(node *yaml.Node) *yaml.Node {
	if node.Kind == yaml.AliasNode {
		return node.Alias
	}
	return node
}

func scalar(node *yaml.Node) (string, error) {
	node = resolve(node)
	if node.Kind != yaml.ScalarNode {
		return "", errors.New("must be a single value")
	}
	if node.Tag == "!!null" {
		return "", nil
	}
	return strings.TrimSpace(node.Value), nil
}

func validateURL(raw string) error {
	if raw == "" {
		return errors.New("url is required")
	}
	parsed, err := url.Parse(raw)
	if err != nil {
		return fmt.Errorf("url: invalid: %q", raw)
	}
	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return fmt.Errorf("url: must be http or https: %q", raw)
	}
	if parsed.Host == "" {
		return fmt.Errorf("url: missing host: %q", raw)
	}
	return nil
}
