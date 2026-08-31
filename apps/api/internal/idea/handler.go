package idea

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
	// Groups
	groups := g.Group("/idea-groups")
	groups.GET("", h.ListGroups)
	groups.POST("", h.CreateGroup)
	groups.DELETE("/:id", h.DeleteGroup)

	// Ideas
	ideas := g.Group("/ideas")
	ideas.GET("", h.ListIdeas)
	ideas.POST("", h.CreateIdea)
	ideas.GET("/:id", h.GetIdeaByID)
	ideas.PATCH("/:id", h.UpdateIdea)
	ideas.DELETE("/:id", h.DeleteIdea)
	ideas.POST("/:id/promote", h.PromoteIdea)
}

func (h *Handler) ListGroups(c echo.Context) error {
	userID := middleware.GetUserID(c)
	items, err := h.service.ListGroups(c.Request().Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response.Success(items))
}

func (h *Handler) CreateGroup(c echo.Context) error {
	userID := middleware.GetUserID(c)
	var input domain.CreateIdeaGroupInput
	if err := c.Bind(&input); err != nil {
		return domain.ErrBadRequest
	}
	item, err := h.service.CreateGroup(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, response.Success(item))
}

func (h *Handler) DeleteGroup(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id := c.Param("id")
	if err := h.service.DeleteGroup(c.Request().Context(), id, userID); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) ListIdeas(c echo.Context) error {
	userID := middleware.GetUserID(c)
	var groupID *string
	if g := c.QueryParam("group_id"); g != "" {
		groupID = &g
	}
	items, err := h.service.ListIdeas(c.Request().Context(), userID, groupID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response.Success(items))
}

func (h *Handler) CreateIdea(c echo.Context) error {
	userID := middleware.GetUserID(c)
	var input domain.CreateIdeaInput
	if err := c.Bind(&input); err != nil {
		return domain.ErrBadRequest
	}
	item, err := h.service.CreateIdea(c.Request().Context(), userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusCreated, response.Success(item))
}

func (h *Handler) GetIdeaByID(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id := c.Param("id")
	item, err := h.service.GetIdeaByID(c.Request().Context(), id, userID)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response.Success(item))
}

func (h *Handler) UpdateIdea(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id := c.Param("id")
	var input domain.UpdateIdeaInput
	if err := c.Bind(&input); err != nil {
		return domain.ErrBadRequest
	}
	item, err := h.service.UpdateIdea(c.Request().Context(), id, userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response.Success(item))
}

func (h *Handler) DeleteIdea(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id := c.Param("id")
	if err := h.service.DeleteIdea(c.Request().Context(), id, userID); err != nil {
		return err
	}
	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) PromoteIdea(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id := c.Param("id")
	var input domain.PromoteIdeaInput
	if err := c.Bind(&input); err != nil {
		return domain.ErrBadRequest
	}
	item, err := h.service.PromoteIdea(c.Request().Context(), id, userID, input)
	if err != nil {
		return err
	}
	return c.JSON(http.StatusOK, response.Success(item))
}