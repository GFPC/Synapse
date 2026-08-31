package apikey

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/pkg/middleware"
	"github.com/synapse/api/pkg/response"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(api *echo.Group) {
	g := api.Group("/auth/api-keys")
	g.POST("", h.Create)
	g.GET("", h.List)
	g.DELETE("/:id", h.Delete)
}

func (h *Handler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	if userID == "" {
		return response.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	var input domain.CreateApiKeyInput
	if err := c.Bind(&input); err != nil {
		return response.NewAppError(http.StatusBadRequest, "INVALID_BODY", err.Error())
	}
	if input.Name == "" {
		input.Name = "Default CLI Key"
	}

	result, err := h.service.Create(c.Request().Context(), userID, input)
	if err != nil {
		return response.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return c.JSON(http.StatusCreated, response.Success(result))
}

func (h *Handler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	if userID == "" {
		return response.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}

	keys, err := h.service.List(c.Request().Context(), userID)
	if err != nil {
		return response.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return c.JSON(http.StatusOK, response.Success(keys))
}

func (h *Handler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	if userID == "" {
		return response.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "Unauthorized")
	}
	id := c.Param("id")

	if err := h.service.Delete(c.Request().Context(), id, userID); err != nil {
		if err == domain.ErrNotFound {
			return response.NewAppError(http.StatusNotFound, "NOT_FOUND", "API key not found")
		}
		return response.NewAppError(http.StatusInternalServerError, "INTERNAL_ERROR", err.Error())
	}

	return c.JSON(http.StatusOK, response.Success(map[string]bool{"deleted": true}))
}
