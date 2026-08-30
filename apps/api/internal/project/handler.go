package project

import (
	"net/http"
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/pkg/middleware"
	"github.com/synapse/api/pkg/response"
)

type Handler struct {
	service   *ProjectService
	validator *validator.Validate
}

func NewHandler(service *ProjectService) *Handler {
	return &Handler{
		service:   service,
		validator: validator.New(),
	}
}

func (h *Handler) RegisterRoutes(g *echo.Group) {
	g.GET("/projects", h.List)
	g.POST("/projects", h.Create)
	g.GET("/projects/:id", h.GetByID)
	g.PATCH("/projects/:id", h.Update)
	g.DELETE("/projects/:id", h.Archive)
	g.POST("/projects/:id/members", h.InviteMember)
	g.PATCH("/projects/:id/members/:userId", h.UpdateMemberRole)
	g.DELETE("/projects/:id/members/:userId", h.RemoveMember)
}

func (h *Handler) List(c echo.Context) error {
	userID := middleware.GetUserID(c)
	cursor := c.QueryParam("cursor")
	limitStr := c.QueryParam("limit")
	limit := 20
	if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
		limit = l
	}

	projects, nextCursor, hasMore, err := h.service.List(c.Request().Context(), userID, cursor, limit)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.SuccessWithMeta(projects, &response.Meta{
		NextCursor: nextCursor,
		HasMore:    hasMore,
	}))
}

func (h *Handler) Create(c echo.Context) error {
	userID := middleware.GetUserID(c)
	var input domain.CreateProjectInput
	if err := c.Bind(&input); err != nil {
		return response.Error(c, domain.ErrBadRequest)
	}
	if err := h.validator.Struct(&input); err != nil {
		return response.Error(c, err)
	}

	project, err := h.service.Create(c.Request().Context(), input, userID)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusCreated, response.Success(project))
}

func (h *Handler) GetByID(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id := c.Param("id")

	project, err := h.service.GetByID(c.Request().Context(), id, userID)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(project))
}

func (h *Handler) Update(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id := c.Param("id")

	var input domain.UpdateProjectInput
	if err := c.Bind(&input); err != nil {
		return response.Error(c, domain.ErrBadRequest)
	}

	project, err := h.service.Update(c.Request().Context(), id, userID, input)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(project))
}

func (h *Handler) Archive(c echo.Context) error {
	userID := middleware.GetUserID(c)
	id := c.Param("id")

	if err := h.service.Archive(c.Request().Context(), id, userID); err != nil {
		return response.Error(c, err)
	}

	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) InviteMember(c echo.Context) error {
	userID := middleware.GetUserID(c)
	projectID := c.Param("id")

	var req struct {
		Email string      `json:"email" validate:"required,email"`
		Role  domain.Role `json:"role" validate:"required"`
	}
	if err := c.Bind(&req); err != nil {
		return response.Error(c, domain.ErrBadRequest)
	}
	if err := h.validator.Struct(&req); err != nil {
		return response.Error(c, err)
	}

	member, err := h.service.InviteMember(c.Request().Context(), projectID, userID, req.Email, req.Role)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusCreated, response.Success(member))
}

func (h *Handler) UpdateMemberRole(c echo.Context) error {
	userID := middleware.GetUserID(c)
	projectID := c.Param("id")
	targetID := c.Param("userId")

	var req struct {
		Role domain.Role `json:"role" validate:"required"`
	}
	if err := c.Bind(&req); err != nil {
		return response.Error(c, domain.ErrBadRequest)
	}

	member, err := h.service.UpdateMemberRole(c.Request().Context(), projectID, userID, targetID, req.Role)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(member))
}

func (h *Handler) RemoveMember(c echo.Context) error {
	userID := middleware.GetUserID(c)
	projectID := c.Param("id")
	targetID := c.Param("userId")

	if err := h.service.RemoveMember(c.Request().Context(), projectID, userID, targetID); err != nil {
		return response.Error(c, err)
	}

	return c.NoContent(http.StatusNoContent)
}
