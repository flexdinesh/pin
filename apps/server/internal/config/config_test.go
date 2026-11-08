package config

import (
	"encoding/json"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

func TestParseGroupsByFirstAppearanceWithUngroupedLast(t *testing.T) {
	cfg, err := Parse([]byte(`
title: Lab
bookmarks:
  - {name: Loose, url: https://loose.test}
  - {name: Z one, url: https://z1.test, group: Zeta}
  - {name: A one, url: https://a1.test, group: Alpha}
  - {name: Z two, url: https://z2.test, group: Zeta}
`))
	if err != nil {
		t.Fatal(err)
	}
	if cfg.Title != "Lab" {
		t.Errorf("title = %q", cfg.Title)
	}
	var got []string
	for _, group := range cfg.Groups {
		var names []string
		for _, bookmark := range group.Bookmarks {
			names = append(names, bookmark.Name)
		}
		got = append(got, group.Name+":"+strings.Join(names, ","))
	}
	want := "Zeta:Z one,Z two|Alpha:A one|:Loose"
	if strings.Join(got, "|") != want {
		t.Errorf("groups = %v, want %s", got, want)
	}
}

func TestParseDefaults(t *testing.T) {
	for _, input := range []string{"", "bookmarks: []\n", "title: '  '\n"} {
		cfg, err := Parse([]byte(input))
		if err != nil {
			t.Fatalf("Parse(%q): %v", input, err)
		}
		if cfg.Title != "pin" {
			t.Errorf("Parse(%q) title = %q", input, cfg.Title)
		}
		encoded, err := json.Marshal(cfg)
		if err != nil {
			t.Fatal(err)
		}
		if !strings.Contains(string(encoded), `"groups":[]`) {
			t.Errorf("Parse(%q) json = %s, want an empty groups array", input, encoded)
		}
	}
}

func TestParseResolvesIcon(t *testing.T) {
	cfg, err := Parse([]byte("bookmarks:\n  - {name: A, url: 'https://a.test', icon: mdi-rss-#112233, description: Feed}\n"))
	if err != nil {
		t.Fatal(err)
	}
	got := cfg.Groups[0].Bookmarks[0]
	if got.Icon == nil || got.Icon.Color != "#112233" || got.Description != "Feed" {
		t.Errorf("bookmark = %+v, icon = %+v", got, got.Icon)
	}
}

func TestParseHalo(t *testing.T) {
	cfg, err := Parse([]byte("bookmarks:\n  - {name: A, url: 'https://a.test', icon: 'https://i.test/a.svg', halo: false}\n  - {name: B, url: 'https://b.test', icon: 'https://i.test/b.svg', halo: true}\n  - {name: C, url: 'https://c.test', icon: grafana}\n"))
	if err != nil {
		t.Fatal(err)
	}
	var got []bool
	for _, bookmark := range cfg.Groups[0].Bookmarks {
		got = append(got, bookmark.NoHalo)
	}
	if want := []bool{true, false, false}; !slices.Equal(got, want) {
		t.Errorf("NoHalo = %v, want %v", got, want)
	}
}

func TestParseResolvesLabels(t *testing.T) {
	cfg, err := Parse([]byte(`
labels:
  vpn: "#0ea5e9"
  beta:   # no color
  unused: "#112233"
bookmarks:
  - {name: A, url: 'https://a.test', label: vpn}
  - {name: B, url: 'https://b.test', label: beta}
  - {name: C, url: 'https://c.test'}
`))
	if err != nil {
		t.Fatal(err)
	}
	encoded, err := json.Marshal(cfg.Groups[0].Bookmarks)
	if err != nil {
		t.Fatal(err)
	}
	want := `[{"name":"A","url":"https://a.test","label":{"name":"vpn","color":"#0ea5e9"}},` +
		`{"name":"B","url":"https://b.test","label":{"name":"beta"}},` +
		`{"name":"C","url":"https://c.test"}]`
	if string(encoded) != want {
		t.Errorf("bookmarks = %s, want %s", encoded, want)
	}
}

func TestParseRejectsBadLabelReferences(t *testing.T) {
	cases := []struct {
		name  string
		entry string
		want  string
	}{
		{"unknown label", "{name: A, url: 'https://a.test', label: nope}", `unknown label "nope"`},
		{"non-scalar label", "{name: A, url: 'https://a.test', label: [vpn, beta]}", "label: must be a single value"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := Parse([]byte("labels: {vpn: '#0ea5e9', beta: }\nbookmarks:\n  - " + tc.entry + "\n"))
			if err == nil {
				t.Fatal("want error")
			}
			if !strings.Contains(err.Error(), "bookmarks[0]") || !strings.Contains(err.Error(), tc.want) {
				t.Errorf("error %q does not name the entry or contain %q", err, tc.want)
			}
		})
	}
}

func TestParseRejectsInvalidLabels(t *testing.T) {
	for name, tc := range map[string]struct{ input, want string }{
		"not a mapping":  {"labels: [vpn]\n", "labels: must be a mapping"},
		"bad hex":        {"labels: {vpn: '#12'}\n", `labels.vpn: color must be #rrggbb: "#12"`},
		"named color":    {"labels: {vpn: red}\n", `labels.vpn: color must be #rrggbb: "red"`},
		"non-scalar":     {"labels: {vpn: [a]}\n", "labels.vpn: must be a single value"},
		"empty name":     {"labels: {'': '#112233'}\n", "name must not be empty"},
		"duplicate":      {"labels: {vpn: '#112233', vpn: '#445566'}\n", `duplicate label "vpn"`},
		"unquoted color": {"labels:\n  vpn: #0ea5e9\n", "labels.vpn: quote the color"},
	} {
		t.Run(name, func(t *testing.T) {
			_, err := Parse([]byte(tc.input))
			if err == nil {
				t.Fatal("want error")
			}
			if !strings.Contains(err.Error(), tc.want) {
				t.Errorf("error %q does not contain %q", err, tc.want)
			}
		})
	}
}

func TestParseReportsLabelAndEntryErrorsTogether(t *testing.T) {
	_, err := Parse([]byte(`
labels: {vpn: red}
bookmarks:
  - {name: A, url: 'https://a.test', label: vpn}
  - {name: B, url: 'https://b.test', label: nope}
`))
	if err == nil {
		t.Fatal("want error")
	}
	for _, want := range []string{"labels.vpn: color must be", `bookmarks[1]: label: unknown label "nope"`} {
		if !strings.Contains(err.Error(), want) {
			t.Errorf("error %q does not contain %q", err, want)
		}
	}
	// A label with a bad color is still a known label.
	if strings.Contains(err.Error(), `unknown label "vpn"`) {
		t.Errorf("error %q reports a defined label as unknown", err)
	}
}

func TestParseRejectsAndNamesTheEntry(t *testing.T) {
	cases := []struct {
		name  string
		entry string
		want  string
	}{
		{"missing name", "{url: 'https://a.test'}", "name is required"},
		{"missing url", "{name: A}", "url is required"},
		{"javascript url", "{name: A, url: 'javascript:alert(1)'}", "must be http or https"},
		{"relative url", "{name: A, url: /x}", "must be http or https"},
		{"url without host", "{name: A, url: 'https://'}", "missing host"},
		{"href key", "{name: A, href: 'https://a.test'}", `unknown key "href"`},
		{"widget key", "{name: A, url: 'https://a.test', widget: {type: x}}", "widget"},
		{"local icon", "{name: A, url: 'https://a.test', icon: /icons/a.png}", "local icon paths"},
		{"bad icon", "{name: A, url: 'https://a.test', icon: 'a b'}", "invalid icon name"},
		{"halo not a boolean", "{name: A, url: 'https://a.test', icon: grafana, halo: 'off'}", "halo: must be true or false"},
		{"halo without icon", "{name: A, url: 'https://a.test', halo: false}", "halo: applies only to image icons"},
		{"halo on mask icon", "{name: A, url: 'https://a.test', icon: mdi-rss, halo: false}", "halo: applies only to image icons"},
		{"duplicate key", "{name: A, name: B, url: 'https://a.test'}", "duplicate"},
		{"not a mapping", "just-a-string", "must be a mapping"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := Parse([]byte("bookmarks:\n  - {name: Good, url: 'https://good.test'}\n  - " + tc.entry + "\n"))
			if err == nil {
				t.Fatal("want error")
			}
			if !strings.Contains(err.Error(), "bookmarks[1]") {
				t.Errorf("error %q does not name the entry", err)
			}
			if !strings.Contains(err.Error(), tc.want) {
				t.Errorf("error %q does not contain %q", err, tc.want)
			}
		})
	}
}

func TestParseReportsAllErrorsTogether(t *testing.T) {
	_, err := Parse([]byte("bookmarks:\n  - {name: A}\n  - {url: 'https://b.test', nope: 1}\n"))
	if err == nil {
		t.Fatal("want error")
	}
	for _, want := range []string{"bookmarks[0]: url is required", "bookmarks[1]: ", `unknown key "nope"`, "name is required"} {
		if !strings.Contains(err.Error(), want) {
			t.Errorf("error %q does not contain %q", err, want)
		}
	}
}

func TestParseRejectsInvalidDocuments(t *testing.T) {
	for name, input := range map[string]string{
		"syntax":             "bookmarks: [",
		"unknown top level":  "services: []\n",
		"bookmarks not list": "bookmarks: nope\n",
	} {
		t.Run(name, func(t *testing.T) {
			if _, err := Parse([]byte(input)); err == nil {
				t.Error("want error")
			}
		})
	}
}

func TestExampleConfigIsValid(t *testing.T) {
	cfg, err := Load(filepath.Join("..", "..", "..", "..", "pin.example.yaml"))
	if err != nil {
		t.Fatal(err)
	}
	if last := cfg.Groups[len(cfg.Groups)-1]; last.Name != "" {
		t.Errorf("last group = %q, want the ungrouped set", last.Name)
	}
}

func TestParseWidgets(t *testing.T) {
	cfg, err := Parse([]byte(`
bookmarks:
  - {name: Plain, url: 'https://plain.test', group: B}
  - {name: Later, url: 'https://later.test', group: B, widget: {type: gatus}}
  - {name: First, url: 'https://first.test', group: A}
  - name: Status
    url: https://status.test
    widget:
      type: gatus
      url: http://gatus.monitoring:8080
  - {name: Empty, url: 'https://empty.test', widget: }
`))
	if err != nil {
		t.Fatal(err)
	}
	got := map[string]string{}
	for _, configured := range cfg.Widgets() {
		got[configured.ID] = configured.Type + " " + configured.URL
	}
	want := map[string]string{
		"0": "gatus https://later.test",
		"1": "gatus http://gatus.monitoring:8080",
	}
	if len(got) != len(want) || got["0"] != want["0"] || got["1"] != want["1"] {
		t.Errorf("widgets = %v, want %v", got, want)
	}
}

func TestWidgetURLStaysOffTheWire(t *testing.T) {
	cfg, err := Parse([]byte("bookmarks:\n  - {name: S, url: 'https://s.test', widget: {type: gatus, url: 'http://internal.test'}}\n"))
	if err != nil {
		t.Fatal(err)
	}
	encoded, err := json.Marshal(cfg)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Contains(string(encoded), "internal.test") {
		t.Errorf("config exposes the widget url: %s", encoded)
	}
	if !strings.Contains(string(encoded), `"widget":{"id":"0","type":"gatus"}`) {
		t.Errorf("config = %s", encoded)
	}
}

func TestParseRejectsBadWidgets(t *testing.T) {
	cases := []struct {
		name   string
		widget string
		want   string
	}{
		{"scalar", "gatus", "widget: must be a mapping"},
		{"list", "[gatus]", "widget: must be a mapping"},
		{"no type", "{url: 'https://g.test'}", "widget: type is required"},
		{"unknown type", "{type: nope}", `widget: unknown type "nope"`},
		{"unknown key", "{type: gatus, token: x}", `widget: unknown key "token"`},
		{"duplicate key", "{type: gatus, type: gatus}", `widget: duplicate key "type"`},
		{"bad scheme", "{type: gatus, url: 'ftp://g.test'}", "widget: url: must be http or https"},
		{"nested url", "{type: gatus, url: [a]}", "widget: url: must be a single value"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			_, err := Parse([]byte("bookmarks:\n  - {name: A, url: 'https://a.test', widget: " + tc.widget + "}\n"))
			if err == nil {
				t.Fatal("want error")
			}
			if !strings.Contains(err.Error(), tc.want) {
				t.Errorf("error = %q, want %q", err, tc.want)
			}
		})
	}
}

func TestLoadReportsMissingFile(t *testing.T) {
	if _, err := Load(filepath.Join(t.TempDir(), "absent.yaml")); err == nil {
		t.Error("want error")
	}
}
