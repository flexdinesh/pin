package icon

import "testing"

func TestParse(t *testing.T) {
	cases := []struct {
		name string
		raw  string
		want Icon
	}{
		{"dashboard default png", "grafana", Icon{KindImage, "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/grafana.png", ""}},
		{"dashboard explicit png", "grafana.png", Icon{KindImage, "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/grafana.png", ""}},
		{"dashboard svg", "unifi-controller.svg", Icon{KindImage, "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/unifi-controller.svg", ""}},
		{"dashboard webp", "grafana.webp", Icon{KindImage, "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/webp/grafana.webp", ""}},
		{"mdi", "mdi-file-compare", Icon{KindMask, "https://cdn.jsdelivr.net/npm/@mdi/svg@latest/svg/file-compare.svg", ""}},
		{"mdi with svg suffix", "mdi-rss.svg", Icon{KindMask, "https://cdn.jsdelivr.net/npm/@mdi/svg@latest/svg/rss.svg", ""}},
		{"mdi with color", "mdi-note-text-#7C6CF2", Icon{KindMask, "https://cdn.jsdelivr.net/npm/@mdi/svg@latest/svg/note-text.svg", "#7C6CF2"}},
		{"simple icons", "si-github", Icon{KindMask, "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg", ""}},
		{"simple icons with color", "si-github-#181717", Icon{KindMask, "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/github.svg", "#181717"}},
		{"selfhst default png", "sh-home-assistant", Icon{KindImage, "https://cdn.jsdelivr.net/gh/selfhst/icons@main/png/home-assistant.png", ""}},
		{"selfhst svg", "sh-home-assistant.svg", Icon{KindImage, "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/home-assistant.svg", ""}},
		{"selfhst webp", "sh-home-assistant.webp", Icon{KindImage, "https://cdn.jsdelivr.net/gh/selfhst/icons@main/webp/home-assistant.webp", ""}},
		{"https url", "https://example.com/favicon.svg", Icon{KindImage, "https://example.com/favicon.svg", ""}},
		{"http url", "http://nas.lan/icon.png", Icon{KindImage, "http://nas.lan/icon.png", ""}},
		{"name starting with http", "httpd", Icon{KindImage, "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/httpd.png", ""}},
		{"name starting with prefix letters", "simple", Icon{KindImage, "https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/png/simple.png", ""}},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got, err := Parse(tc.raw)
			if err != nil {
				t.Fatalf("Parse(%q): %v", tc.raw, err)
			}
			if got != tc.want {
				t.Errorf("Parse(%q) = %+v, want %+v", tc.raw, got, tc.want)
			}
		})
	}
}

func TestParseRejects(t *testing.T) {
	cases := []struct {
		name string
		raw  string
	}{
		{"local path", "/icons/foo.png"},
		{"url without host", "https://"},
		{"mdi without name", "mdi-"},
		{"mdi with short hex", "mdi-rss-#abc"},
		{"css injection in mask", "mdi-rss)--evil"},
		{"path traversal", "../secret"},
		{"nested path", "foo/bar"},
		{"selfhst without name", "sh-"},
		{"spaces", "my icon"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got, err := Parse(tc.raw); err == nil {
				t.Errorf("Parse(%q) = %+v, want error", tc.raw, got)
			}
		})
	}
}
