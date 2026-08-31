package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/labstack/echo/v4"
	emiddleware "github.com/labstack/echo/v4/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	"github.com/synapse/api/config"
	"github.com/synapse/api/internal/apikey"
	"github.com/synapse/api/internal/attachment"
	"github.com/synapse/api/internal/auth"
	"github.com/synapse/api/internal/comment"
	"github.com/synapse/api/internal/idea"
	"github.com/synapse/api/internal/node"
	"github.com/synapse/api/internal/project"
	"github.com/synapse/api/internal/quickdrop"
	"github.com/synapse/api/internal/search"
	"github.com/synapse/api/internal/webhook"
	"github.com/synapse/api/internal/ws"
	"github.com/synapse/api/pkg/database"
	mw "github.com/synapse/api/pkg/middleware"
	"github.com/synapse/api/pkg/metrics"
	"github.com/synapse/api/pkg/response"
)

func main() {
	// ?? 1. Config ????????????????????????????????????????????????????????????
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "err", err)
		os.Exit(1)
	}

	// ?? 2. Logger ?????????????????????????????????????????????????????????????
	logLevel := slog.LevelInfo
	if cfg.Env == "development" {
		logLevel = slog.LevelDebug
	}
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: logLevel})))

	// ?? 3. Database ???????????????????????????????????????????????????????????
	ctx := context.Background()
	pool, err := database.NewPool(ctx, database.Config{
		URL:               cfg.Database.URL,
		MaxConns:          cfg.Database.MaxConns,
		MinConns:          cfg.Database.MinConns,
		MaxConnIdleTime:   cfg.Database.MaxConnIdleTime,
		HealthCheckPeriod: cfg.Database.HealthCheckPeriod,
	})
	if err != nil {
		slog.Error("failed to connect to database", "err", err)
		os.Exit(1)
	}
	defer pool.Close()
	slog.Info("database connected")

	// ?? 4. Migrations ?????????????????????????????????????????????????????????
	if err := database.RunMigrations(ctx, pool, "db/migrations"); err != nil {
		slog.Error("failed to run migrations", "err", err)
		os.Exit(1)
	}
	slog.Info("migrations applied")

	// ?? 5. Prometheus metrics ?????????????????????????????????????????????????
	if err := metrics.Register(); err != nil {
		slog.Warn("metrics already registered", "err", err)
	}

	// ?? 6. WebSocket Hub + LockStore ??????????????????????????????????????????
	hub := ws.NewHub()
	go hub.Run()

	lockStore := ws.NewLockStore()
	go lockStore.Cleanup(ctx, func(nodeID string) {
		hub.BroadcastToProject("", ws.Event{
			Type: ws.EventNodeUnlocked,
			Data: map[string]string{"node_id": nodeID},
		}, "")
	})

	// ?? 7. Repositories ???????????????????????????????????????????????????????
	authRepo       := auth.NewRepository(pool)
	projectRepo    := project.NewRepository(pool)
	nodeRepo       := node.NewRepository(pool)
	commentRepo    := comment.NewRepository(pool)
	attachmentRepo := attachment.NewRepository(pool)
	quickdropRepo  := quickdrop.NewRepository(pool)
	ideaRepo       := idea.NewRepository(pool)
	apiKeyRepo     := apikey.NewRepository(pool)
	webhookRepo    := webhook.NewRepository(pool)

	// ?? 8. Services ???????????????????????????????????????????????????????????
	authSvc       := auth.NewService(authRepo, auth.Config{
		JWTSecret:       cfg.Auth.JWTSecret,
		AccessTokenExp:  cfg.Auth.AccessTTL,
		RefreshTokenExp: cfg.Auth.RefreshTTL,
	})
	projectSvc    := project.NewService(projectRepo)
	nodeSvc       := node.NewService(nodeRepo, hub, lockStore)
	commentSvc    := comment.NewService(commentRepo, nodeRepo, hub)
	attachmentSvc := attachment.NewService(attachmentRepo, nodeRepo, cfg.Upload.Dir, cfg.Upload.MaxSizeMB)
	searchSvc     := search.NewService(pool)
	quickdropSvc  := quickdrop.NewService(quickdropRepo, hub, cfg.Upload.Dir)
	ideaSvc       := idea.NewService(ideaRepo, nodeRepo, hub)
	apiKeySvc     := apikey.NewService(apiKeyRepo)
	webhookSvc    := webhook.NewService(webhookRepo, hub)

	// ?? 9. Handlers ???????????????????????????????????????????????????????????
	authHandler       := auth.NewHandler(authSvc)
	projectHandler    := project.NewHandler(projectSvc)
	nodeHandler       := node.NewHandler(nodeSvc)
	commentHandler    := comment.NewHandler(commentSvc)
	attachmentHandler := attachment.NewHandler(attachmentSvc)
	searchHandler     := search.NewHandler(searchSvc)
	quickdropHandler  := quickdrop.NewHandler(quickdropSvc)
	ideaHandler       := idea.NewHandler(ideaSvc)
	apiKeyHandler     := apikey.NewHandler(apiKeySvc)
	webhookHandler    := webhook.NewHandler(webhookSvc)
	wsHandler         := ws.NewHandler(hub, cfg.Auth.JWTSecret)

	// ?? 10. Echo ??????????????????????????????????????????????????????????????
	e := echo.New()
	e.HideBanner = true
	e.HTTPErrorHandler = response.ErrorHandler

	// Middleware stack
	e.Use(emiddleware.RequestID())
	e.Use(mw.Logger())
	e.Use(emiddleware.Recover())
	e.Use(emiddleware.CORSWithConfig(emiddleware.CORSConfig{
		AllowOrigins: []string{"*"},
		AllowMethods: []string{http.MethodGet, http.MethodPost, http.MethodPatch, http.MethodDelete},
		AllowHeaders: []string{echo.HeaderContentType, echo.HeaderAuthorization},
	}))
	e.Use(mw.RateLimit(cfg.RateLimit.RPS, cfg.RateLimit.Burst))
	e.Use(metrics.HTTPMiddleware())

	// ?? 11. Routes ????????????????????????????????????????????????????????????

	// Public
	e.GET("/health", func(c echo.Context) error {
		if err := database.HealthCheck(ctx, pool); err != nil {
			return c.JSON(http.StatusServiceUnavailable, map[string]string{"status": "error", "db": err.Error()})
		}
		return c.JSON(http.StatusOK, map[string]string{"status": "ok", "db": "ok"})
	})
	e.GET("/metrics", echo.WrapHandler(promhttp.Handler()))
	e.GET("/ws", wsHandler.Handle)

	authHandler.RegisterPublicRoutes(e)
	webhookHandler.RegisterRoutes(e) // GitHub webhooks

	// Protected (JWT or syn_live_ API Key required)
	apiAuthMiddleware := mw.AuthMiddleware(cfg.Auth.JWTSecret, func(ctx context.Context, key string) (string, string, []string, error) {
		u, err := apiKeySvc.ValidateKey(ctx, key)
		if err != nil {
			return "", "", nil, err
		}
		return u.UserID, u.Email, u.Permissions, nil
	})

	api := e.Group("/api", apiAuthMiddleware)
	projectHandler.RegisterRoutes(api)
	nodeHandler.RegisterRoutes(api)
	commentHandler.RegisterRoutes(api)
	attachmentHandler.RegisterRoutes(api)
	searchHandler.RegisterRoutes(api)
	quickdropHandler.RegisterRoutes(api)
	ideaHandler.RegisterRoutes(api)
	apiKeyHandler.RegisterRoutes(api)
	authHandler.RegisterProtectedRoutes(api)

	// ?? 12. Start + Graceful Shutdown ?????????????????????????????????????????
	go func() {
		addr := fmt.Sprintf(":%d", cfg.Server.Port)
		slog.Info("server starting", "addr", addr)
		if err := e.Start(addr); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	slog.Info("shutting down server...")
	shutCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := e.Shutdown(shutCtx); err != nil {
		slog.Error("shutdown error", "err", err)
	}
	slog.Info("server stopped")
}
