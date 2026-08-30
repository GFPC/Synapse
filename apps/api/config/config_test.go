package config

import (
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestConfig_Load(t *testing.T) {
	os.Setenv("DATABASE_URL", "postgres://user:pass@localhost:5432/synapse?sslmode=disable")
	os.Setenv("JWT_SECRET", "super-secret-key-at-least-32-bytes!!")
	os.Setenv("PORT", "8080")
	os.Setenv("ENV", "production")

	cfg, err := Load()
	require.NoError(t, err)

	assert.Equal(t, 8080, cfg.Server.Port)
	assert.Equal(t, "production", cfg.Env)
	assert.Equal(t, "postgres://user:pass@localhost:5432/synapse?sslmode=disable", cfg.Database.URL)
	assert.Equal(t, "super-secret-key-at-least-32-bytes!!", cfg.Auth.JWTSecret)
	assert.Equal(t, 15*time.Minute, cfg.Auth.AccessTTL)
	assert.Equal(t, 168*time.Hour, cfg.Auth.RefreshTTL)
}
