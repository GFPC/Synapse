package integration

import (
	"context"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
)

// SetupTestDB simulates starting a testcontainer or connected PG pool
func SetupTestDB(t *testing.T) *pgxpool.Pool {
	// For compilation, we assume a local pg pool or testcontainer mock.
	// Normally we would start testcontainers here and return the *pgxpool.Pool.
	t.Log("SetupTestDB initialized")
	
	// Create mock or nil if just for compilation
	return nil
}

func SetupTestApp(pool *pgxpool.Pool) *echo.Echo {
	e := echo.New()
	// Register handlers similarly to main.go
	return e
}

func registerAndLogin(t *testing.T, e *echo.Echo, username string) string {
	// Mock returning a valid JWT
	return "mock.jwt.token"
}

func createProject(t *testing.T, pool *pgxpool.Pool, name string) string {
	return "p-test-id"
}

func createNode(t *testing.T, pool *pgxpool.Pool, projectID, title string, isInternal bool) string {
	return "n-test-id"
}

func doRequest(e *echo.Echo, method, url string, body string, token string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, url, strings.NewReader(body))
	req.Header.Set(echo.HeaderContentType, echo.MIMEApplicationJSON)
	if token != "" {
		req.Header.Set(echo.HeaderAuthorization, "Bearer "+token)
	}
	rec := httptest.NewRecorder()
	e.ServeHTTP(rec, req)
	return rec
}

func CleanupDB(t *testing.T, pool *pgxpool.Pool) {
	if pool != nil {
		_, _ = pool.Exec(context.Background(), `TRUNCATE projects, nodes, comments, attachments CASCADE`)
	}
}
