package middleware

import (
	"net/http"
	"strings"
	"github.com/golang-jwt/jwt/v5"
	"github.com/labstack/echo/v4"
	"github.com/synapse/api/pkg/response"
)

func JWTMiddleware(secret string) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			authHeader := c.Request().Header.Get("Authorization")
			if authHeader == "" {
				return response.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "Missing token")
			}
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				return response.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "Invalid token format")
			}
			tokenStr := parts[1]
			
			token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
				return []byte(secret), nil
			})
			
			if err != nil || !token.Valid {
				return response.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "Invalid token")
			}
			
			claims, ok := token.Claims.(jwt.MapClaims)
			if !ok {
				return response.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "Invalid claims")
			}
			
			userID, _ := claims["user_id"].(string)
			if userID == "" {
				userID, _ = claims["sub"].(string)
			}
			c.Set("user_id", userID)
			c.Set("user_email", claims["email"])
			c.Set("role", claims["role"])
			
			return next(c)
		}
	}
}

func GetUserID(c echo.Context) string {
	v, _ := c.Get("user_id").(string)
	return v
}

func GetUserEmail(c echo.Context) string {
	v, _ := c.Get("user_email").(string)
	return v
}
