// Package icon resolves icon strings from a pin config into something a
// browser can load, using the same sources as gethomepage.
package icon

import (
	"errors"
	"fmt"
	"net/url"
	"regexp"
	"strings"
)

const (
	dashboardIconsURL = "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons"
	selfhstIconsURL   = "https://cdn.jsdelivr.net/gh/selfhst/icons@main"
	mdiIconsURL       = "https://cdn.jsdelivr.net/npm/@mdi/svg@latest/svg"
	simpleIconsURL    = "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons"
)

// Kind says how the browser must draw an icon.
type Kind string

const (
	// KindImage is drawn as an image with its own colors.
	KindImage Kind = "image"
	// KindMask is a monochrome SVG drawn as a CSS mask over a color.
	KindMask Kind = "mask"
)

// Icon is a resolved icon. An empty Color on a mask means the theme color.
type Icon struct {
	Kind  Kind   `json:"kind"`
	Src   string `json:"src"`
	Color string `json:"color,omitempty"`
}

var (
	maskPattern  = regexp.MustCompile(`^(mdi|si)-([A-Za-z0-9_-]+?)(?:\.svg)?(?:-(#[0-9a-fA-F]{6}))?$`)
	imagePattern = regexp.MustCompile(`^([A-Za-z0-9][A-Za-z0-9._-]*?)(?:\.(svg|webp|png))?$`)
)

// Parse resolves a non-empty icon string. Names are restricted to safe
// characters because they end up inside URLs and CSS url() values.
func Parse(raw string) (Icon, error) {
	switch {
	case strings.HasPrefix(raw, "http://"), strings.HasPrefix(raw, "https://"):
		return parseURL(raw)
	case strings.HasPrefix(raw, "/"):
		return Icon{}, errors.New("local icon paths are not supported")
	case strings.HasPrefix(raw, "mdi-"), strings.HasPrefix(raw, "si-"):
		return parseMask(raw)
	case strings.HasPrefix(raw, "sh-"):
		return parseImage(raw, strings.TrimPrefix(raw, "sh-"), selfhstIconsURL)
	default:
		return parseImage(raw, raw, dashboardIconsURL)
	}
}

func parseURL(raw string) (Icon, error) {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Host == "" {
		return Icon{}, fmt.Errorf("invalid icon URL %q", raw)
	}
	return Icon{Kind: KindImage, Src: raw}, nil
}

func parseMask(raw string) (Icon, error) {
	match := maskPattern.FindStringSubmatch(raw)
	if match == nil {
		return Icon{}, fmt.Errorf("invalid icon name %q", raw)
	}
	base := mdiIconsURL
	if match[1] == "si" {
		base = simpleIconsURL
	}
	return Icon{Kind: KindMask, Src: base + "/" + match[2] + ".svg", Color: match[3]}, nil
}

func parseImage(raw, name, base string) (Icon, error) {
	match := imagePattern.FindStringSubmatch(name)
	if match == nil {
		return Icon{}, fmt.Errorf("invalid icon name %q", raw)
	}
	extension := match[2]
	if extension == "" {
		extension = "png"
	}
	return Icon{Kind: KindImage, Src: base + "/" + extension + "/" + match[1] + "." + extension}, nil
}
