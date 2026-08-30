package ws

import (
	"net/http"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/labstack/echo/v4"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type Handler struct {
	hub       *Hub
	jwtSecret string
}

func NewHandler(hub *Hub, jwtSecret string) *Handler {
	return &Handler{
		hub:       hub,
		jwtSecret: jwtSecret,
	}
}

func (h *Handler) Handle(c echo.Context) error {
	tokenString := c.QueryParam("token")
	var userID, userName string

	if tokenString != "" && h.jwtSecret != "" {
		token, err := jwt.Parse(tokenString, func(t *jwt.Token) (interface{}, error) {
			return []byte(h.jwtSecret), nil
		})
		if err == nil && token.Valid {
			if claims, ok := token.Claims.(jwt.MapClaims); ok {
				if uid, ok := claims["user_id"].(string); ok {
					userID = uid
				} else if sub, ok := claims["sub"].(string); ok {
					userID = sub
				}
				if email, ok := claims["email"].(string); ok {
					userName = email
				}
			}
		}
	}

	if userID == "" {
		userID = c.QueryParam("user_id")
		userName = c.QueryParam("user_name")
	}

	if userID == "" {
		return echo.NewHTTPError(http.StatusUnauthorized, "missing or invalid token")
	}

	projectID := c.QueryParam("project_id")

	conn, err := upgrader.Upgrade(c.Response(), c.Request(), nil)
	if err != nil {
		return err
	}

	client := NewClient(h.hub, conn, userID, userName, projectID)
	h.hub.register <- client

	go client.WritePump()
	go client.ReadPump()

	return nil
}
