package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRateLimiter(t *testing.T) {
	e := echo.New()
	mw := RateLimit(2, 2) // 2 reqs per sec, burst 2

	handler := mw(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	req1 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req1.RemoteAddr = "192.0.2.1:1234"
	rec1 := httptest.NewRecorder()
	err1 := handler(e.NewContext(req1, rec1))
	require.NoError(t, err1)

	req2 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req2.RemoteAddr = "192.0.2.1:1234"
	rec2 := httptest.NewRecorder()
	err2 := handler(e.NewContext(req2, rec2))
	require.NoError(t, err2)

	// Third request in burst window should be rate limited
	req3 := httptest.NewRequest(http.MethodGet, "/test", nil)
	req3.RemoteAddr = "192.0.2.1:1234"
	rec3 := httptest.NewRecorder()
	err3 := handler(e.NewContext(req3, rec3))
	assert.Error(t, err3)
}
