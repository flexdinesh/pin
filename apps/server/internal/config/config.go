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
	"regexp"
	"strconv"
	"strings"

	"go.yaml.in/yaml/v3"

	"github.com/flexdinesh/pin/apps/server/internal/icon"
	"github.com/flexdinesh/pin/apps/server/internal/widget"
)

const defaultTitle = "pin"

var (
	colorPattern = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
	// YAML reads an unquoted color as a comment, leaving the label silently colorless.
	unquotedColorPattern = regexp.MustCompile(`^#[0-9a-fA-F]{6}\s*$`)
)

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
	Label       *Label     `json:"label,omitempty"`
	Widget      *Widget    `json:"widget,omitempty"`
}

// Label marks a bookmark. An empty Color draws it in neutral ink.
type Label struct {
	Name  string `json:"name"`
	Color string `json:"color,omitempty"`
}

// Widget adds live data to a bookmark's tile. URL is where this server reads it
// from, possibly an internal address, so it never reaches the browser.
type Widget struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	URL  string `json:"-"`
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
		Labels    yaml.Node   `yaml:"labels"`
		Bookmarks []yaml.Node `yaml:"bookmarks"`
	}
	decoder := yaml.NewDecoder(bytes.NewReader(data))
	decoder.KnownFields(true)
	if err := decoder.Decode(&raw); err != nil && !errors.Is(err, io.EOF) {
		return Config{}, err
	}

	labels, labelErrs := parseLabels(&raw.Labels)
	var (
		errs      = labelErrs
		order     []string
		grouped   = map[string][]Bookmark{}
		ungrouped []Bookmark
	)
	for i := range raw.Bookmarks {
		group, bookmark, err := parseEntry(&raw.Bookmarks[i], labels)
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
	for i, configured := range cfg.Widgets() {
		configured.ID = strconv.Itoa(i)
	}
	return cfg, nil
}

// Widgets lists the configured widgets in display order.
func (c Config) Widgets() []*Widget {
	var widgets []*Widget
	for _, group := range c.Groups {
		for _, bookmark := range group.Bookmarks {
			if bookmark.Widget != nil {
				widgets = append(widgets, bookmark.Widget)
			}
		}
	}
	return widgets
}

// parseLabels keeps a label whose color is invalid, so bookmarks using it do not
// also report it as unknown.
func parseLabels(node *yaml.Node) (map[string]Label, []error) {
	labels := map[string]Label{}
	node = resolve(node)
	if node.Kind == 0 || node.Tag == "!!null" {
		return labels, nil
	}
	if node.Kind != yaml.MappingNode {
		return labels, []error{errors.New("labels: must be a mapping")}
	}

	var errs []error
	for i := 0; i+1 < len(node.Content); i += 2 {
		key := node.Content[i]
		name := strings.TrimSpace(key.Value)
		if name == "" {
			errs = append(errs, errors.New("labels: name must not be empty"))
			continue
		}
		if _, seen := labels[name]; seen {
			errs = append(errs, fmt.Errorf("labels: duplicate label %q", name))
			continue
		}
		labels[name] = Label{Name: name}

		value := node.Content[i+1]
		color, err := scalar(value)
		if err != nil {
			errs = append(errs, fmt.Errorf("labels.%s: %w", name, err))
			continue
		}
		switch {
		case color == "" && (unquotedColorPattern.MatchString(key.LineComment) || unquotedColorPattern.MatchString(value.LineComment)):
			errs = append(errs, fmt.Errorf("labels.%s: quote the color, or YAML reads it as a comment", name))
		case color != "" && !colorPattern.MatchString(color):
			errs = append(errs, fmt.Errorf("labels.%s: color must be #rrggbb: %q", name, color))
		default:
			labels[name] = Label{Name: name, Color: color}
		}
	}
	return labels, errs
}

func parseEntry(node *yaml.Node, labels map[string]Label) (string, Bookmark, error) {
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

		if key == "widget" {
			parsed, err := parseWidget(node.Content[i+1])
			if err != nil {
				errs = append(errs, fmt.Errorf("widget: %w", err))
				continue
			}
			bookmark.Widget = parsed
			continue
		}

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
		case "label":
			if value == "" {
				continue
			}
			label, known := labels[value]
			if !known {
				errs = append(errs, fmt.Errorf("label: unknown label %q", value))
				continue
			}
			bookmark.Label = &label
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
	if bookmark.Widget != nil && bookmark.Widget.URL == "" {
		bookmark.Widget.URL = rawURL
	}
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

// parseWidget leaves URL empty when unset, so the bookmark's url applies.
func parseWidget(node *yaml.Node) (*Widget, error) {
	node = resolve(node)
	if node.Tag == "!!null" {
		return nil, nil
	}
	if node.Kind != yaml.MappingNode {
		return nil, errors.New("must be a mapping")
	}

	var (
		errs   []error
		parsed Widget
		seen   = map[string]bool{}
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
		case "type":
			parsed.Type = value
		case "url":
			if value == "" {
				continue
			}
			if err := validateURL(value); err != nil {
				errs = append(errs, err)
				continue
			}
			parsed.URL = value
		default:
			errs = append(errs, fmt.Errorf("unknown key %q", key))
		}
	}

	switch parsed.Type {
	case "":
		errs = append(errs, errors.New("type is required"))
	case widget.TypeGatus:
	default:
		errs = append(errs, fmt.Errorf("unknown type %q", parsed.Type))
	}
	if err := errors.Join(errs...); err != nil {
		return nil, err
	}
	return &parsed, nil
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
