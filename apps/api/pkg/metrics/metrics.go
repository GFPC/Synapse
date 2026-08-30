package metrics

import (
	"strconv"
	"time"
	"github.com/labstack/echo/v4"
	"github.com/prometheus/client_golang/prometheus"
)

var (
	HTTPDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "http_request_duration_seconds",
			Help: "Duration of HTTP requests.",
		},
		[]string{"method", "path", "status"},
	)
	DBDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "db_query_duration_seconds",
			Help: "Duration of DB queries.",
		},
		[]string{"query"},
	)
	WSConnections = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "ws_connections",
			Help: "Active WebSocket connections.",
		},
		[]string{"project_id"},
	)
	WSBroadcastDuration = prometheus.NewHistogram(
		prometheus.HistogramOpts{
			Name: "ws_broadcast_duration_seconds",
			Help: "Duration to broadcast WebSocket messages.",
		},
	)
	NodeCreatedTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "node_created_total",
			Help: "Total number of nodes created.",
		},
		[]string{"type"},
	)
)

func Register() error {
	prometheus.MustRegister(HTTPDuration)
	prometheus.MustRegister(DBDuration)
	prometheus.MustRegister(WSConnections)
	prometheus.MustRegister(WSBroadcastDuration)
	prometheus.MustRegister(NodeCreatedTotal)
	return nil
}

func HTTPMiddleware() echo.MiddlewareFunc {
	return func(next echo.HandlerFunc) echo.HandlerFunc {
		return func(c echo.Context) error {
			start := time.Now()
			err := next(c)
			status := c.Response().Status
			if err != nil {
				if he, ok := err.(*echo.HTTPError); ok {
					status = he.Code
				}
			}
			HTTPDuration.WithLabelValues(c.Request().Method, c.Path(), strconv.Itoa(status)).Observe(time.Since(start).Seconds())
			return err
		}
	}
}
