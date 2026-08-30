package response

import (
	"errors"
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/synapse/api/internal/domain"
)

type Meta struct {
	NextCursor string `json:"next_cursor,omitempty"`
	HasMore    bool   `json:"has_more"`
	Total      int    `json:"total,omitempty"`
}

type Response[T any] struct {
	Data T     `json:"data"`
	Meta *Meta `json:"meta,omitempty"`
}

func Success[T any](data T) Response[T] {
	return Response[T]{Data: data}
}

func SuccessWithMeta[T any](data T, meta *Meta) Response[T] {
	return Response[T]{Data: data, Meta: meta}
}

type AppError struct {
	HTTPStatus int               `json:"-"`
	Code       string            `json:"code"`
	Message    string            `json:"message"`
	Details    map[string]string `json:"details,omitempty"`
}

func (e *AppError) Error() string {
	return e.Message
}

func NewAppError(status int, code, message string) *AppError {
	return &AppError{HTTPStatus: status, Code: code, Message: message}
}

func (e *AppError) WithDetails(details map[string]string) *AppError {
	e.Details = details
	return e
}

// Error maps errors to JSON response with correct HTTP status codes
func Error(c echo.Context, err error) error {
	if err == nil {
		return nil
	}

	if appErr, ok := err.(*AppError); ok {
		return c.JSON(appErr.HTTPStatus, appErr)
	}

	if errors.Is(err, domain.ErrNotFound) {
		return c.JSON(http.StatusNotFound, AppError{Code: "NOT_FOUND", Message: err.Error()})
	}
	if errors.Is(err, domain.ErrUnauthorized) {
		return c.JSON(http.StatusUnauthorized, AppError{Code: "UNAUTHORIZED", Message: err.Error()})
	}
	if errors.Is(err, domain.ErrForbidden) {
		return c.JSON(http.StatusForbidden, AppError{Code: "FORBIDDEN", Message: err.Error()})
	}
	if errors.Is(err, domain.ErrConflict) {
		return c.JSON(http.StatusConflict, AppError{Code: "CONFLICT", Message: err.Error()})
	}
	if errors.Is(err, domain.ErrBadRequest) {
		return c.JSON(http.StatusBadRequest, AppError{Code: "BAD_REQUEST", Message: err.Error()})
	}

	if valErrs, ok := err.(validator.ValidationErrors); ok {
		details := make(map[string]string)
		for _, fe := range valErrs {
			details[fe.Field()] = fe.Tag()
		}
		return c.JSON(http.StatusBadRequest, AppError{
			Code:    "VALIDATION_ERROR",
			Message: "Validation failed",
			Details: details,
		})
	}

	if he, ok := err.(*echo.HTTPError); ok {
		msg := "HTTP error"
		if s, ok := he.Message.(string); ok {
			msg = s
		}
		return c.JSON(he.Code, AppError{Code: "HTTP_ERROR", Message: msg})
	}

	return c.JSON(http.StatusInternalServerError, AppError{Code: "INTERNAL_ERROR", Message: err.Error()})
}

// ErrorHandler is Echo's global HTTP error handler
func ErrorHandler(err error, c echo.Context) {
	if c.Response().Committed {
		return
	}
	_ = Error(c, err)
}
