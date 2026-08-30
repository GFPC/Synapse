package response

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
	"github.com/stretchr/testify/assert"
	"github.com/synapse/api/internal/domain"
)

func TestResponse_Success(t *testing.T) {
	resp := Success("test-data")
	assert.Equal(t, "test-data", resp.Data)
	assert.Nil(t, resp.Meta)
}

func TestResponse_SuccessWithMeta(t *testing.T) {
	meta := &Meta{NextCursor: "c1", HasMore: true, Total: 10}
	resp := SuccessWithMeta("test-data", meta)
	assert.Equal(t, "test-data", resp.Data)
	assert.Equal(t, "c1", resp.Meta.NextCursor)
	assert.True(t, resp.Meta.HasMore)
	assert.Equal(t, 10, resp.Meta.Total)
}

func TestResponse_ErrorMapping(t *testing.T) {
	e := echo.New()

	tests := []struct {
		name       string
		err        error
		wantStatus int
		wantCode   string
	}{
		{"NotFound", domain.ErrNotFound, http.StatusNotFound, "NOT_FOUND"},
		{"Unauthorized", domain.ErrUnauthorized, http.StatusUnauthorized, "UNAUTHORIZED"},
		{"Forbidden", domain.ErrForbidden, http.StatusForbidden, "FORBIDDEN"},
		{"Conflict", domain.ErrConflict, http.StatusConflict, "CONFLICT"},
		{"BadRequest", domain.ErrBadRequest, http.StatusBadRequest, "BAD_REQUEST"},
		{"AppError", NewAppError(http.StatusTeapot, "TEAPOT", "I'm a teapot"), http.StatusTeapot, "TEAPOT"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			req := httptest.NewRequest(http.MethodGet, "/", nil)
			c := e.NewContext(req, rec)

			err := Error(c, tt.err)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantStatus, rec.Code)

			var appErr AppError
			err = json.Unmarshal(rec.Body.Bytes(), &appErr)
			assert.NoError(t, err)
			assert.Equal(t, tt.wantCode, appErr.Code)
		})
	}
}
