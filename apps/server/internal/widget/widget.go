// Package widget reads live data for bookmark tiles from the apps they link to.
// Requests come from this server because those apps send no CORS headers.
package widget

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"
)

// TypeGatus reads a Gatus instance's public endpoint statuses.
const TypeGatus = "gatus"

const (
	fetchTimeout = 5 * time.Second
	// One result per endpoint is about 1KB, and the container's memory is small.
	maxBodyBytes = 4 << 20
)

var client = &http.Client{Timeout: fetchTimeout}

// Status counts endpoints by their latest result.
type Status struct {
	Up   int `json:"up"`
	Down int `json:"down"`
}

// Fetch reads the current status from the app at baseURL.
func Fetch(ctx context.Context, widgetType, baseURL string) (Status, error) {
	switch widgetType {
	case TypeGatus:
		return fetchGatus(ctx, baseURL)
	default:
		return Status{}, fmt.Errorf("unknown widget type %q", widgetType)
	}
}

func fetchGatus(ctx context.Context, baseURL string) (Status, error) {
	base, err := url.Parse(baseURL)
	if err != nil {
		return Status{}, fmt.Errorf("gatus url: %w", err)
	}
	endpoint := base.JoinPath("api/v1/endpoints/statuses")
	endpoint.RawQuery = "pageSize=1"

	request, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint.String(), nil)
	if err != nil {
		return Status{}, err
	}
	response, err := client.Do(request)
	if err != nil {
		return Status{}, err
	}
	defer func() { _ = response.Body.Close() }()
	if response.StatusCode != http.StatusOK {
		return Status{}, fmt.Errorf("gatus returned %d", response.StatusCode)
	}

	var endpoints []struct {
		Results []struct {
			Success bool `json:"success"`
		} `json:"results"`
	}
	if err := json.NewDecoder(io.LimitReader(response.Body, maxBodyBytes)).Decode(&endpoints); err != nil {
		return Status{}, fmt.Errorf("decode gatus statuses: %w", err)
	}

	var status Status
	for _, endpoint := range endpoints {
		// No results yet, as right after a restart, says nothing about its health.
		if len(endpoint.Results) == 0 {
			continue
		}
		if endpoint.Results[len(endpoint.Results)-1].Success {
			status.Up++
		} else {
			status.Down++
		}
	}
	return status, nil
}
