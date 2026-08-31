package quickdrop

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

func (h *Handler) RegisterRoutes(g *echo.Group) {
	qd := g.Group("/quick-drop")
	qd.GET("", h.List)
	qd.POST("", h.Create)
	qd.POST("/upload", h.Upload)
	qd.PATCH("/:id/pin", h.TogglePin)
	qd.DELETE("/:id", h.Delete)
	qd.DELETE("", h.ClearUnpinned)
}

func (h *Handler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	items, err := h.service.List(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response.Success(items))
}

func (h *Handler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	var input domain.CreateQuickDropInput
	if err := c.Bind(&input); err != nil {
		return domain.ErrBadRequest
	}
	item, err := h.service.Create(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, response.Success(item))
}

func (h *Handler) Upload(c echo.Context) error {
	userID := middleware.GetUserID(c)
	file, header, err := c.Request().FormFile("file")
	if err != nil {
		return domain.ErrBadRequest
	}
	defer file.Close()

	item, err := h.service.UploadFile(c.Request().Context(), userID, file, header)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, response.Success(item))
}

func (h *Handler) TogglePin(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id := c.Param("id")
	item, err := h.service.TogglePin(c.Request().Context(), id, userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response.Success(item))
}

func (h *Handler) Delete(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id := c.Param("id")
	if err := h.service.Delete(c.Request().Context(), id, userID); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) ClearUnpinned(c echo.Context) error {
	userID := middleware.GetUserID(c)
	if err := h.service.ClearUnpinned(c.Request().Context(), userID); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}