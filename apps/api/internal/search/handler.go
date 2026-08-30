package search

import (
	"net/http"
	"strconv"

	"github.com/labstack/echo/v4"
	"github.com/synapse/api/pkg/middleware"
	"github.com/synapse/api/pkg/response"
)

type Handler struct {
	service *SearchService
}

func NewHandler(service *SearchService) *Handler {
	return &Handler{service: service}
}

func (h *Handler) RegisterRoutes(e *echo.Group) {
	e.GET("/search", h.Search)
}

func (h *Handler) Search(c echo.Context) error {
	q := c.QueryParam("q")
	if len(q) < 2 {
		return response.NewAppError(http.StatusBadRequest, "BAD_REQUEST", "query must be at least 2 characters")
	}

	limit, _ := strconv.Atoi(c.QueryParam("limit"))
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	var projectID *string
	if p := c.QueryParam("project_id"); p != "" {
		projectID = &p
	}

	var nodeType *string
	if t := c.QueryParam("type"); t != "" {
		nodeType = &t
	}

	userID := middleware.GetUserID(c)

	results, meta, err := h.service.Search(c.Request().Context(), SearchParams{
		Query:     q,
		ProjectID: projectID,
		NodeType:  nodeType,
		UserID:    userID,
		Limit:     limit,
	})

	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.SuccessWithMeta(results, &response.Meta{
		Total: int(meta.Total),
	}))
}
