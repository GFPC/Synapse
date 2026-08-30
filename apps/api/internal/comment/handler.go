package comment

import (
	"net/http"
	"strconv"

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
	g.GET("/nodes/:id/comments", h.GetByNode)
	g.POST("/nodes/:id/comments", h.Create)
	g.PATCH("/comments/:id", h.Update)
	g.DELETE("/comments/:id", h.Delete)
	g.POST("/comments/:id/reactions", h.ToggleReaction)
}

func (h *Handler) Create(c echo.Context) error {
	nodeID := c.Param("id")
	userID := middleware.GetUserID(c)

	var req struct {
		ReplyToID *string `json:"reply_to_id"`
		Content   string  `json:"content"`
	}
	if err := c.Bind(&req); err != nil {
		return response.NewAppError(http.StatusBadRequest, "BAD_REQUEST", err.Error())
	}

	comment, err := h.svc.Create(c.Request().Context(), nodeID, userID, req.ReplyToID, req.Content)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusCreated, response.Success(comment))
}

func (h *Handler) GetByNode(c echo.Context) error {
	nodeID := c.Param("id")
	userID := middleware.GetUserID(c)
	cursor := c.QueryParam("cursor")
	limitStr := c.QueryParam("limit")
	limit := 20
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}

	comments, nextCursor, hasMore, err := h.svc.GetByNode(c.Request().Context(), nodeID, userID, cursor, limit)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.SuccessWithMeta(comments, &response.Meta{
		NextCursor: nextCursor,
		HasMore:    hasMore,
	}))
}

func (h *Handler) Update(c echo.Context) error {
	id := c.Param("id")
	userID := middleware.GetUserID(c)
	var req struct {
		Content string `json:"content"`
	}
	if err := c.Bind(&req); err != nil {
		return response.NewAppError(http.StatusBadRequest, "BAD_REQUEST", err.Error())
	}

	comment, err := h.svc.Update(c.Request().Context(), id, userID, req.Content)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(comment))
}

func (h *Handler) Delete(c echo.Context) error {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	if err := h.svc.Delete(c.Request().Context(), id, userID); err != nil {
		return response.Error(c, err)
	}

	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) ToggleReaction(c echo.Context) error {
	id := c.Param("id")
	userID := middleware.GetUserID(c)
	var req struct {
		Emoji string `json:"emoji"`
	}
	if err := c.Bind(&req); err != nil {
		return response.NewAppError(http.StatusBadRequest, "BAD_REQUEST", err.Error())
	}

	added, err := h.svc.ToggleReaction(c.Request().Context(), id, userID, req.Emoji)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(map[string]bool{"added": added}))
}
