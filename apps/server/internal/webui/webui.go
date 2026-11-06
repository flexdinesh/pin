// Package webui embeds the built web app.
package webui

import (
	"embed"
	"fmt"
	"io/fs"
)

//go:embed all:dist
var embedded embed.FS

// Assets returns the built web app, rooted at the directory holding index.html.
func Assets() (fs.FS, error) {
	assets, err := fs.Sub(embedded, "dist")
	if err != nil {
		return nil, fmt.Errorf("open embedded assets: %w", err)
	}
	return assets, nil
}
