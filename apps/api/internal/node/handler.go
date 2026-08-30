package node

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
	service   *NodeService
	validator *validator.Validate
}

func NewHandler(service *NodeService) *Handler {
	return &Handler{
		service:   service,
		validator: validator.New(),
	}
}

func (h *Handler) RegisterRoutes(e *echo.Group) {
	e.GET("/projects/:id/nodes", h.List)
	e.POST("/projects/:id/nodes", h.Create)
	e.GET("/nodes/:id", h.GetByID)
	e.PATCH("/nodes/:id", h.Update)
	e.DELETE("/nodes/:id", h.Delete)
	e.PATCH("/nodes/:id/canvas", h.UpdateCanvas)
	e.POST("/nodes/:id/lock", h.LockNode)
	e.DELETE("/nodes/:id/lock", h.UnlockNode)
	e.GET("/nodes/:id/relations", h.GetRelations)
	e.POST("/nodes/:id/relations", h.CreateRelation)
	e.DELETE("/relations/:id", h.DeleteRelation)
}

func (h *Handler) List(c echo.Context) error {
	projectID := c.Param("id")
	userID := middleware.GetUserID(c)
	typeFilter := c.QueryParam("type")
	visibility := c.QueryParam("visibility")
	cursor := c.QueryParam("cursor")
	limit, _ := strconv.Atoi(c.QueryParam("limit"))

	params := domain.ListNodesParams{
		ProjectID:  projectID,
		UserID:     userID,
		TypeFilter: typeFilter,
		Visibility: visibility,
		Cursor:     cursor,
		Limit:      limit,
	}

	nodes, nextCursor, hasMore, err := h.service.List(c.Request().Context(), params)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.SuccessWithMeta(nodes, &response.Meta{
		NextCursor: nextCursor,
		HasMore:    hasMore,
	}))
}

func (h *Handler) Create(c echo.Context) error {
	projectID := c.Param("id")
	userID := middleware.GetUserID(c)

	var input domain.CreateNodeInput
	if err := c.Bind(&input); err != nil {
		return response.Error(c, domain.ErrBadRequest)
	}
	if err := h.validator.Struct(&input); err != nil {
		return response.Error(c, err)
	}

	node, err := h.service.Create(c.Request().Context(), projectID, userID, input)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusCreated, response.Success(node))
}

func (h *Handler) GetByID(c echo.Context) error {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	node, err := h.service.GetByID(c.Request().Context(), id, userID)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(node))
}

func (h *Handler) Update(c echo.Context) error {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	var input domain.UpdateNodeInput
	if err := c.Bind(&input); err != nil {
		return response.Error(c, domain.ErrBadRequest)
	}

	node, err := h.service.Update(c.Request().Context(), id, userID, input)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(node))
}

func (h *Handler) Delete(c echo.Context) error {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	if err := h.service.Delete(c.Request().Context(), id, userID); err != nil {
		return response.Error(c, err)
	}

	return c.NoContent(http.StatusNoContent)
}

func (h *Handler) UpdateCanvas(c echo.Context) error {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	var req struct {
		X float64 `json:"x"`
		Y float64 `json:"y"`
	}
	if err := c.Bind(&req); err != nil {
		return response.Error(c, domain.ErrBadRequest)
	}

	if err := h.service.UpdateCanvas(c.Request().Context(), id, userID, req.X, req.Y); err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(map[string]float64{"x": req.X, "y": req.Y}))
}

func (h *Handler) LockNode(c echo.Context) error {
	id := c.Param("id")
	userID := middleware.GetUserID(c)
	userName := middleware.GetUserEmail(c)

	if err := h.service.LockNode(c.Request().Context(), id, userID, userName); err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(map[string]string{"status": "locked"}))
}

func (h *Handler) UnlockNode(c echo.Context) error {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	if err := h.service.UnlockNode(c.Request().Context(), id, userID); err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(map[string]string{"status": "unlocked"}))
}

func (h *Handler) GetRelations(c echo.Context) error {
	nodeID := c.Param("id")
	userID := middleware.GetUserID(c)

	rels, err := h.service.GetRelations(c.Request().Context(), nodeID, userID)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(rels))
}

func (h *Handler) CreateRelation(c echo.Context) error {
	fromID := c.Param("id")
	userID := middleware.GetUserID(c)

	var input domain.CreateRelationInput
	if err := c.Bind(&input); err != nil {
		return response.Error(c, domain.ErrBadRequest)
	}
	if err := h.validator.Struct(&input); err != nil {
		return response.Error(c, err)
	}

	rel, err := h.service.CreateRelation(c.Request().Context(), fromID, input.ToNodeID, input.Type, input.Note, userID)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusCreated, response.Success(rel))
}

func (h *Handler) DeleteRelation(c echo.Context) error {
	id := c.Param("id")
	userID := middleware.GetUserID(c)

	if err := h.service.DeleteRelation(c.Request().Context(), id, userID); err != nil {
		return response.Error(c, err)
	}

	return c.NoContent(http.StatusNoContent)
}
