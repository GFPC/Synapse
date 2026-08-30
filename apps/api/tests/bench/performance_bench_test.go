package bench

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"github.com/synapse/api/config"
	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/internal/node"
	"github.com/synapse/api/internal/project"
	"github.com/synapse/api/internal/search"
	"github.com/synapse/api/internal/ws"
	"github.com/synapse/api/pkg/database"
	"github.com/synapse/api/pkg/id"
	"github.com/synapse/api/pkg/middleware"
)

// 1. Core ID Generation
func BenchmarkID_NewDisplayID(b *testing.B) {
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		_ = id.NewDisplayID("feature", i)
	}
}

func BenchmarkID_CursorEncodeDecode(b *testing.B) {
	now := time.Now()
	uid := "123e4567-e89b-12d3-a456-426614174000"
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		enc := id.EncodeCursor(now, uid)
		_, _, _ = id.DecodeCursor(enc)
	}
}

// 2. JWT Generation & Verification
func BenchmarkAuth_JWTGeneration(b *testing.B) {
	secret := []byte("synapse_dev_super_secret_jwt_key_32bytes_min!")
	claims := jwt.MapClaims{
		"user_id": "u123",
		"email":   "test@synapse.io",
		"exp":     time.Now().Add(time.Hour).Unix(),
	}
	b.ReportAllocs()
	for i := 0; i < b.N; i++ {
		token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		_, _ = token.SignedString(secret)
	}
}

func BenchmarkAuth_JWTValidation(b *testing.B) {
	secret := []byte("synapse_dev_super_secret_jwt_key_32bytes_min!")
	claims := jwt.MapClaims{
		"user_id": "u123",
		"email":   "test@synapse.io",
		"exp":     time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString(secret)

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			return secret, nil
		})
	}
}

// 3. LockStore Concurrent Performance
func BenchmarkLockStore_AcquireRelease(b *testing.B) {
	ls := ws.NewLockStore()
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		nodeID := fmt.Sprintf("node-%d", i%1000)
		_ = ls.Acquire(nodeID, "u1", "User 1")
		_ = ls.Release(nodeID, "u1")
	}
}

func BenchmarkLockStore_ParallelAcquire(b *testing.B) {
	ls := ws.NewLockStore()
	b.ReportAllocs()
	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			nodeID := fmt.Sprintf("node-%d", i%500)
			ls.Acquire(nodeID, fmt.Sprintf("user-%d", i%50), "User")
			ls.Release(nodeID, fmt.Sprintf("user-%d", i%50))
			i++
		}
	})
}

// 4. HTTP Echo Pipeline (Routing + Context + Middleware)
func BenchmarkHTTP_HealthEndpoint(b *testing.B) {
	e := echo.New()
	e.GET("/health", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"status": "ok"})
	})

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
	}
}

func BenchmarkHTTP_ProtectedPipelineWithJWT(b *testing.B) {
	secret := "synapse_dev_super_secret_jwt_key_32bytes_min!"
	claims := jwt.MapClaims{
		"user_id": "u123",
		"email":   "test@synapse.io",
		"exp":     time.Now().Add(time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenStr, _ := token.SignedString([]byte(secret))

	e := echo.New()
	api := e.Group("/api", middleware.JWTMiddleware(secret))
	api.GET("/nodes", func(c echo.Context) error {
		return c.JSON(http.StatusOK, map[string]string{"user_id": middleware.GetUserID(c)})
	})

	req := httptest.NewRequest(http.MethodGet, "/api/nodes", nil)
	req.Header.Set("Authorization", "Bearer "+tokenStr)

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		rec := httptest.NewRecorder()
		e.ServeHTTP(rec, req)
	}
}

// 5. Live Database Benchmarks against local PostgreSQL
func getLiveDB(b *testing.B) *pgxpool.Pool {
	cfg, err := config.Load()
	if err != nil {
		b.Skip("skipping db benchmark: config not loaded")
	}
	pool, err := database.NewPool(context.Background(), database.Config{
		URL:               cfg.Database.URL,
		MaxConns:          cfg.Database.MaxConns,
		MinConns:          cfg.Database.MinConns,
		MaxConnIdleTime:   cfg.Database.MaxConnIdleTime,
		HealthCheckPeriod: cfg.Database.HealthCheckPeriod,
	})
	if err != nil {
		b.Skip("skipping db benchmark: postgres not reachable")
	}
	return pool
}

func BenchmarkDB_Ping(b *testing.B) {
	pool := getLiveDB(b)
	defer pool.Close()
	ctx := context.Background()

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = pool.Ping(ctx)
	}
}

func BenchmarkDB_NodeInsertAndQuery(b *testing.B) {
	pool := getLiveDB(b)
	defer pool.Close()
	ctx := context.Background()

	projectRepo := project.NewRepository(pool)
	nodeRepo := node.NewRepository(pool)

	// Create test user and project
	_, _ = pool.Exec(ctx, `INSERT INTO users (id, name, email, password_hash) VALUES ('bench-owner-1', 'Bench User', 'bench@synapse.io', 'hash') ON CONFLICT (id) DO NOTHING`)
	p, err := projectRepo.Create(ctx, domain.CreateProjectInput{Name: "Bench Project"}, "bench-owner-1")
	if err != nil {
		b.Fatalf("failed to create project: %v", err)
	}

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		authorID := "bench-owner-1"
		title := fmt.Sprintf("Feature Note %d", i)
		content := "Реализация высокопроизводительного поиска с индексами PostgreSQL tsvector и GIN"
		n, err := nodeRepo.Create(ctx, p.ID, authorID, domain.CreateNodeInput{
			Type:       domain.NodeTypeFeature,
			Title:      title,
			Content:    content,
			Visibility: domain.VisibilityShared,
		})
		if err != nil {
			b.Fatalf("failed to insert node: %v", err)
		}

		// Read back
		_, _, err = nodeRepo.GetByID(ctx, n.ID, authorID)
		if err != nil {
			b.Fatalf("failed to get node: %v", err)
		}
	}
}

func BenchmarkDB_RussianFTSSearch(b *testing.B) {
	pool := getLiveDB(b)
	defer pool.Close()
	ctx := context.Background()
	searchSvc := search.NewService(pool)

	b.ReportAllocs()
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _, err := searchSvc.Search(ctx, search.SearchParams{
			Query:  "высокопроизводительный поиск",
			UserID: "bench-owner-1",
			Limit:  20,
		})
		if err != nil {
			b.Fatalf("search failed: %v", err)
		}
	}
}
