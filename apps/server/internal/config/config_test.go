package config

import (
	"encoding/json"
	"path/filepath"
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
		{"gethomepage href key", "{name: A, href: 'https://a.test'}", `unknown key "href"`},
		{"widget key", "{name: A, url: 'https://a.test', widget: {type: x}}", "widget"},
		{"local icon", "{name: A, url: 'https://a.test', icon: /icons/a.png}", "local icon paths"},
		{"bad icon", "{name: A, url: 'https://a.test', icon: 'a b'}", "invalid icon name"},
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

func TestLoadReportsMissingFile(t *testing.T) {
	if _, err := Load(filepath.Join(t.TempDir(), "absent.yaml")); err == nil {
		t.Error("want error")
	}
}
