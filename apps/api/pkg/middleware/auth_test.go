package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/synapse/api/pkg/response"
)

func TestJWTMiddleware(t *testing.T) {
	secret := "test-secret-key-32-bytes-long!!"
	e := echo.New()
	e.HTTPErrorHandler = response.ErrorHandler

	// Token generator helper
	genToken := func(userID, email string, exp time.Duration) string {
		claims := jwt.MapClaims{
			"user_id": userID,
			"email":   email,
			"exp":     time.Now().Add(exp).Unix(),
		}
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		s, _ := token.SignedString([]byte(secret))
		return s
	}

	handler := JWTMiddleware(secret)(func(c echo.Context) error {
		return c.String(http.StatusOK, "ok")
	})

	t.Run("Valid Token", func(t *testing.T) {
		tokenStr := genToken("u123", "user@synapse.io", time.Hour)
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		req.Header.Set("Authorization", "Bearer "+tokenStr)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := handler(c)
		require.NoError(t, err)
		assert.Equal(t, "u123", GetUserID(c))
		assert.Equal(t, "user@synapse.io", GetUserEmail(c))
	})

	t.Run("Missing Authorization Header", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := handler(c)
		assert.Error(t, err)
	})

	t.Run("Expired Token", func(t *testing.T) {
		tokenStr := genToken("u123", "user@synapse.io", -time.Hour)
		req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
		req.Header.Set("Authorization", "Bearer "+tokenStr)
		rec := httptest.NewRecorder()
		c := e.NewContext(req, rec)

		err := handler(c)
		assert.Error(t, err)
	})
}
