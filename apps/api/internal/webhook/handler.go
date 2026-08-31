package webhook

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/synapse/api/pkg/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(e *echo.Echo) {
	e.POST("/api/webhooks/github", h.HandleGitHubWebhook)
}

func (h *Handler) HandleGitHubWebhook(c echo.Context) error {
	event := c.Request().Header.Get("X-GitHub-Event")

	switch event {
	case "push":
		var payload GitHubPushPayload
		if err := c.Bind(&payload); err != nil {
			return response.NewAppError(http.StatusBadRequest, "INVALID_PAYLOAD", err.Error())
		}
		_ = h.service.HandlePush(c.Request().Context(), payload)
		return c.JSON(http.StatusOK, map[string]string{"status": "push_processed"})

	case "pull_request":
		var payload GitHubPRPayload
		if err := c.Bind(&payload); err != nil {
			return response.NewAppError(http.StatusBadRequest, "INVALID_PAYLOAD", err.Error())
		}
		_ = h.service.HandlePullRequest(c.Request().Context(), payload)
		return c.JSON(http.StatusOK, map[string]string{"status": "pr_processed"})

	case "ping":
		return c.JSON(http.StatusOK, map[string]string{"status": "pong"})

	default:
		return c.JSON(http.StatusOK, map[string]string{"status": "event_ignored", "event": event})
	}
}
