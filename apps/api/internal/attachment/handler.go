package attachment

import (
	"net/http"

	"github.com/labstack/echo/v4"
	"github.com/synapse/api/pkg/middleware"
	"github.com/synapse/api/pkg/response"
)

type Handler struct {
	svc *Service
}

func NewHandler(svc *Service) *Handler {
	return &Handler{svc: svc}
}

func (h *Handler) RegisterRoutes(g *echo.Group) {
	g.POST("/nodes/:id/attachments", h.Upload)
	g.GET("/attachments/:id/download", h.Download)
	g.DELETE("/attachments/:id", h.Delete)
}

func (h *Handler) Upload(c echo.Context) error {
	nodeID := c.Param("id")
	userID := middleware.GetUserID(c)

	attachType := c.FormValue("type") // image, file, or embed
	if attachType == "embed" {
		embedURL := c.FormValue("embed_url")
		if embedURL == "" {
			return response.NewAppError(http.StatusBadRequest, "BAD_REQUEST", "embed_url required")
		}
		att, err := h.svc.AddEmbed(c.Request().Context(), nodeID, userID, embedURL)
		if err != nil {
			return response.Error(c, err)
		}
		return c.JSON(http.StatusCreated, response.Success(att))
	}

	fileHeader, err := c.FormFile("file")
	if err != nil {
		return response.NewAppError(http.StatusBadRequest, "BAD_REQUEST", "file missing")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return response.Error(c, err)
	}
	defer file.Close()

	att, err := h.svc.Upload(c.Request().Context(), nodeID, userID, file, fileHeader, attachType)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusCreated, response.Success(att))
}

func (h *Handler) Download(c echo.Context) error {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	path, filename, err := h.svc.Download(c.Request().Context(), id, userID)
	if err != nil {
		return response.NewAppError(http.StatusNotFound, "NOT_FOUND", "file not found or access denied")
	}

	return c.Attachment(path, filename)
}

func (h *Handler) Delete(c echo.Context) error {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	if err := h.svc.Delete(c.Request().Context(), id, userID); err != nil {
		return response.Error(c, err)
	}

	return c.NoContent(http.StatusNoContent)
}
