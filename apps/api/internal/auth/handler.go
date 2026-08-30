package auth

import (
	"net/http"

	"github.com/go-playground/validator/v10"
	"github.com/labstack/echo/v4"
	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/pkg/middleware"
	"github.com/synapse/api/pkg/response"
)

type RegisterRequest struct {
	Name     string `json:"name" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

type Handler struct {
	service   *AuthService
	validator *validator.Validate
}

func NewHandler(service *AuthService) *Handler {
	return &Handler{
		service:   service,
		validator: validator.New(),
	}
}

func (h *Handler) RegisterRoutes(e *echo.Echo) {
	e.POST("/api/auth/register", h.Register)
	e.POST("/api/auth/login", h.Login)
	e.POST("/api/auth/refresh", h.Refresh)
	e.GET("/api/auth/me", h.GetMe, middleware.JWTMiddleware(h.service.cfg.JWTSecret))
}

func (h *Handler) Register(c echo.Context) error {
	var req RegisterRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, domain.ErrBadRequest)
	}

	if err := h.validator.Struct(&req); err != nil {
		return response.Error(c, err)
	}

	tokens, user, err := h.service.Register(c.Request().Context(), req.Name, req.Email, req.Password)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusCreated, response.Success(map[string]interface{}{
		"tokens": tokens,
		"user":   user,
	}))
}

func (h *Handler) Login(c echo.Context) error {
	var req LoginRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, domain.ErrBadRequest)
	}

	if err := h.validator.Struct(&req); err != nil {
		return response.Error(c, err)
	}

	tokens, user, err := h.service.Login(c.Request().Context(), req.Email, req.Password)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(map[string]interface{}{
		"tokens": tokens,
		"user":   user,
	}))
}

func (h *Handler) Refresh(c echo.Context) error {
	var req RefreshRequest
	if err := c.Bind(&req); err != nil {
		return response.Error(c, domain.ErrBadRequest)
	}

	if err := h.validator.Struct(&req); err != nil {
		return response.Error(c, err)
	}

	accessToken, err := h.service.RefreshToken(c.Request().Context(), req.RefreshToken)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(map[string]interface{}{
		"access_token": accessToken,
	}))
}

func (h *Handler) GetMe(c echo.Context) error {
	userID := middleware.GetUserID(c)
	if userID == "" {
		return response.Error(c, domain.ErrUnauthorized)
	}

	user, err := h.service.GetMe(c.Request().Context(), userID)
	if err != nil {
		return response.Error(c, err)
	}

	return c.JSON(http.StatusOK, response.Success(user))
}
