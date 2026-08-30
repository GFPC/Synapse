package middleware

import (
	"net/http"
	"sync"
	"time"
	"github.com/labstack/echo/v4"
	"golang.org/x/time/rate"
	"github.com/synapse/api/pkg/response"
)

type visitor struct {
	limiter  *rate.Limiter
	lastSeen time.Time
}

var (
	visitors = make(map[string]*visitor)
	mu       sync.Mutex
)

func init() {
	go cleanupVisitors()
}

func cleanupVisitors() {
	for {
		time.Sleep(3 * time.Minute)
		mu.Lock()
		for ip, v := range visitors {
			if time.Since(v.lastSeen) > 3*time.Minute {
				delete(visitors, ip)
			}
		}
		mu.Unlock()
	}
}

func RateLimiter(rps float64, burst int) echo.MiddlewareFunc {
	return RateLimit(rps, burst)
}

func RateLimit(rps float64, burst int) echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			ip := c.RealIP()
			
			mu.Lock()
			v, exists := visitors[ip]
			if !exists {
				limiter := rate.NewLimiter(rate.Limit(rps), burst)
				v = &visitor{limiter: limiter}
				visitors[ip] = v
			}
			v.lastSeen = time.Now()
			allow := v.limiter.Allow()
			mu.Unlock()
			
			if !allow {
				return response.NewAppError(http.StatusTooManyRequests, "RATE_LIMIT_EXCEEDED", "Too many requests")
			}
			return next(c)
		}
	}
}
