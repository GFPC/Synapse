package config

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

type Config struct {
	Server    ServerConfig
	Database  DatabaseConfig
	Auth      AuthConfig
	Upload    UploadConfig
	WS        WSConfig
	RateLimit RateLimitConfig
	Env       string
}

type ServerConfig struct {
	Port int
}

type DatabaseConfig struct {
	URL               string
	MaxConns          int32
	MinConns          int32
	MaxConnIdleTime   time.Duration
	HealthCheckPeriod time.Duration
}

type AuthConfig struct {
	JWTSecret  string
	AccessTTL  time.Duration
	RefreshTTL time.Duration
}

type UploadConfig struct {
	Dir       string
	MaxSizeMB int64
}

type WSConfig struct {
	MaxMessageSize int64
	WriteWait      time.Duration
	PongWait       time.Duration
	PingPeriod     time.Duration
}

type RateLimitConfig struct {
	RPS   float64
	Burst int
}

// loadDotEnv searches for .env in current and parent directories and loads variables into os.Environ
func loadDotEnv() {
	dir, err := os.Getwd()
	if err != nil {
		return
	}

	for i := 0; i < 4; i++ {
		envPath := filepath.Join(dir, ".env")
		if file, err := os.Open(envPath); err == nil {
			scanner := bufio.NewScanner(file)
			for scanner.Scan() {
				line := strings.TrimSpace(scanner.Text())
				if line == "" || strings.HasPrefix(line, "#") {
					continue
				}
				parts := strings.SplitN(line, "=", 2)
				if len(parts) == 2 {
					key := strings.TrimSpace(parts[0])
					val := strings.TrimSpace(parts[1])
					val = strings.Trim(val, `"'`)
					if os.Getenv(key) == "" {
						os.Setenv(key, val)
					}
				}
			}
			file.Close()
			return
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			break
		}
		dir = parent
	}
}

func Load() (*Config, error) {
	loadDotEnv()

	cfg := &Config{}
	var err error

	cfg.Env = getEnv("ENV", "development")

	cfg.Server.Port, err = strconv.Atoi(getEnv("PORT", "3000"))
	if err != nil {
		return nil, fmt.Errorf("PORT: %w", err)
	}

	cfg.Database.URL = requireEnv("DATABASE_URL")
	if cfg.Database.URL == "" {
		return nil, fmt.Errorf("DATABASE_URL is required")
	}

	maxConns, _ := strconv.ParseInt(getEnv("DB_MAX_CONNS", "20"), 10, 32)
	minConns, _ := strconv.ParseInt(getEnv("DB_MIN_CONNS", "5"), 10, 32)
	cfg.Database.MaxConns = int32(maxConns)
	cfg.Database.MinConns = int32(minConns)
	cfg.Database.MaxConnIdleTime = parseDuration(getEnv("DB_MAX_CONN_IDLE_TIME", "5m"))
	cfg.Database.HealthCheckPeriod = parseDuration(getEnv("DB_HEALTH_CHECK_PERIOD", "1m"))

	cfg.Auth.JWTSecret = requireEnv("JWT_SECRET")
	if cfg.Auth.JWTSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}
	cfg.Auth.AccessTTL = parseDuration(getEnv("JWT_ACCESS_TTL", "15m"))
	cfg.Auth.RefreshTTL = parseDuration(getEnv("JWT_REFRESH_TTL", "168h"))

	cfg.Upload.Dir = getEnv("UPLOAD_DIR", "./data/uploads")
	maxFileMB, _ := strconv.ParseInt(getEnv("MAX_FILE_SIZE_MB", "50"), 10, 64)
	cfg.Upload.MaxSizeMB = maxFileMB

	maxMsgSize, _ := strconv.ParseInt(getEnv("WS_MAX_MESSAGE_SIZE", "65536"), 10, 64)
	cfg.WS.MaxMessageSize = maxMsgSize
	cfg.WS.WriteWait = parseDuration(getEnv("WS_WRITE_WAIT", "10s"))
	cfg.WS.PongWait = parseDuration(getEnv("WS_PONG_WAIT", "60s"))
	cfg.WS.PingPeriod = parseDuration(getEnv("WS_PING_PERIOD", "54s"))

	rps, _ := strconv.ParseFloat(getEnv("RATE_LIMIT_RPS", "100"), 64)
	burst, _ := strconv.Atoi(getEnv("RATE_LIMIT_BURST", "50"))
	cfg.RateLimit.RPS = rps
	cfg.RateLimit.Burst = burst

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func requireEnv(key string) string {
	return os.Getenv(key)
}

func parseDuration(s string) time.Duration {
	d, err := time.ParseDuration(s)
	if err != nil {
		return 0
	}
	return d
}
