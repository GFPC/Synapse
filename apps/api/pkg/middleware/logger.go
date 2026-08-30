package middleware

import (
	"log/slog"
	"time"
	"github.com/labstack/echo/v4"
	"github.com/google/uuid"
)

func RequestID() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			reqID := c.Request().Header.Get("X-Request-ID")
			if reqID == "" {
				reqID = uuid.New().String()
			}
			c.Response().Header().Set("X-Request-ID", reqID)
			c.Set("request_id", reqID)
			return next(c)
		}
	}
}

func Logger() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()
			err := next(c)
			duration := time.Since(start)
			
			req := c.Request()
			res := c.Response()
			
			reqID, _ := c.Get("request_id").(string)
			userID := GetUserID(c)
			
			args := []any{
				slog.String("method", req.Method),
				slog.String("path", req.URL.Path),
				slog.Int("status", res.Status),
				slog.Int64("duration_ms", duration.Milliseconds()),
				slog.String("request_id", reqID),
				slog.String("user_id", userID),
			}
			
			if err != nil {
				c.Error(err)
				args = append(args, slog.String("error", err.Error()))
			}
			
			if duration > 500*time.Millisecond {
				slog.Warn("Slow request", args...)
			} else {
				slog.Info("Request handled", args...)
			}
			
			return nil
		}
	}
}
