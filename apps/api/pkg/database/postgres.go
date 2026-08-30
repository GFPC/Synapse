package database

import (
	"context"
	_ "embed"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed init_schema.sql
var embeddedSchemaSQL string

type Config struct {
	URL               string
	MaxConns          int32
	MinConns          int32
	MaxConnIdleTime   time.Duration
	HealthCheckPeriod time.Duration
}

func NewPool(ctx context.Context, cfg Config) (*pgxpool.Pool, error) {
	poolCfg, err := pgxpool.ParseConfig(cfg.URL)
	if err != nil {
		return nil, err
	}

	poolCfg.MaxConns = cfg.MaxConns
	poolCfg.MinConns = cfg.MinConns
	poolCfg.MaxConnIdleTime = cfg.MaxConnIdleTime
	poolCfg.HealthCheckPeriod = cfg.HealthCheckPeriod

	pool, err := pgxpool.NewWithConfig(ctx, poolCfg)
	if err != nil {
		return nil, err
	}

	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("cannot ping postgres at %s: %w (make sure PostgreSQL is running via 'docker compose up -d postgres')", cfg.URL, err)
	}

	if err := warmPool(ctx, pool, int(cfg.MinConns)); err != nil {
		return nil, err
	}

	return pool, nil
}

func warmPool(ctx context.Context, pool *pgxpool.Pool, n int) error {
	var wg sync.WaitGroup
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			conn, err := pool.Acquire(ctx)
			if err == nil {
				conn.Release()
			}
		}()
	}
	wg.Wait()
	return nil
}

func HealthCheck(ctx context.Context, pool *pgxpool.Pool) error {
	_, err := pool.Exec(ctx, "SELECT 1")
	return err
}

// RunMigrations executes initial database migrations directly through pgxpool
func RunMigrations(ctx context.Context, pool *pgxpool.Pool, migrationsPath string) error {
	sqlContent := embeddedSchemaSQL

	// If embedded is empty, attempt to read from disk
	if sqlContent == "" {
		dir, _ := os.Getwd()
		for i := 0; i < 4; i++ {
			candidate := filepath.Join(dir, migrationsPath, "001_init.up.sql")
			if data, err := os.ReadFile(candidate); err == nil {
				sqlContent = string(data)
				break
			}
			parent := filepath.Dir(dir)
			if parent == dir {
				break
			}
			dir = parent
		}
	}

	if sqlContent == "" {
		return fmt.Errorf("migration SQL file not found in embedded schema or on disk")
	}

	_, err := pool.Exec(ctx, sqlContent)
	if err != nil {
		return fmt.Errorf("migration execution failed: %w", err)
	}

	return nil
}
