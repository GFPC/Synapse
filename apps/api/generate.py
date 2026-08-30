import os

base_dir = r"C:\Users\greg\.gemini\antigravity\scratch\synapse-api"

files = {}

files["config/config.go"] = """package config

import (
\t"fmt"
\t"os"
\t"strconv"
\t"time"
)

type Config struct {
\tServer   ServerConfig
\tDatabase DatabaseConfig
\tAuth     AuthConfig
\tUpload   UploadConfig
\tWS       WSConfig
\tRateLimit RateLimitConfig
\tEnv      string
}

type ServerConfig struct {
\tPort int
}

type DatabaseConfig struct {
\tURL                string
\tMaxConns           int32
\tMinConns           int32
\tMaxConnIdleTime    time.Duration
\tHealthCheckPeriod  time.Duration
}

type AuthConfig struct {
\tJWTSecret  string
\tAccessTTL  time.Duration
\tRefreshTTL time.Duration
}

type UploadConfig struct {
\tDir        string
\tMaxSizeMB  int64
}

type WSConfig struct {
\tMaxMessageSize int64
\tWriteWait      time.Duration
\tPongWait       time.Duration
\tPingPeriod     time.Duration
}

type RateLimitConfig struct {
\tRPS   float64
\tBurst int
}

func Load() (*Config, error) {
\tcfg := &Config{}
\tvar err error

\tcfg.Env = getEnv("ENV", "development")

\tcfg.Server.Port, err = strconv.Atoi(getEnv("PORT", "3000"))
\tif err != nil {
\t\treturn nil, fmt.Errorf("PORT: %w", err)
\t}

\tcfg.Database.URL = requireEnv("DATABASE_URL")
\tif cfg.Database.URL == "" {
\t\treturn nil, fmt.Errorf("DATABASE_URL is required")
\t}

\tmaxConns, _ := strconv.ParseInt(getEnv("DB_MAX_CONNS", "20"), 10, 32)
\tminConns, _ := strconv.ParseInt(getEnv("DB_MIN_CONNS", "5"), 10, 32)
\tcfg.Database.MaxConns = int32(maxConns)
\tcfg.Database.MinConns = int32(minConns)
\tcfg.Database.MaxConnIdleTime = parseDuration(getEnv("DB_MAX_CONN_IDLE_TIME", "5m"))
\tcfg.Database.HealthCheckPeriod = parseDuration(getEnv("DB_HEALTH_CHECK_PERIOD", "1m"))

\tcfg.Auth.JWTSecret = requireEnv("JWT_SECRET")
\tif cfg.Auth.JWTSecret == "" {
\t\treturn nil, fmt.Errorf("JWT_SECRET is required")
\t}
\tcfg.Auth.AccessTTL = parseDuration(getEnv("JWT_ACCESS_TTL", "15m"))
\tcfg.Auth.RefreshTTL = parseDuration(getEnv("JWT_REFRESH_TTL", "168h"))

\tcfg.Upload.Dir = getEnv("UPLOAD_DIR", "/data/uploads")
\tmaxFileMB, _ := strconv.ParseInt(getEnv("MAX_FILE_SIZE_MB", "50"), 10, 64)
\tcfg.Upload.MaxSizeMB = maxFileMB

\tmaxMsgSize, _ := strconv.ParseInt(getEnv("WS_MAX_MESSAGE_SIZE", "65536"), 10, 64)
\tcfg.WS.MaxMessageSize = maxMsgSize
\tcfg.WS.WriteWait = parseDuration(getEnv("WS_WRITE_WAIT", "10s"))
\tcfg.WS.PongWait = parseDuration(getEnv("WS_PONG_WAIT", "60s"))
\tcfg.WS.PingPeriod = parseDuration(getEnv("WS_PING_PERIOD", "54s"))

\trps, _ := strconv.ParseFloat(getEnv("RATE_LIMIT_RPS", "100"), 64)
\tburst, _ := strconv.Atoi(getEnv("RATE_LIMIT_BURST", "50"))
\tcfg.RateLimit.RPS = rps
\tcfg.RateLimit.Burst = burst

\treturn cfg, nil
}

func getEnv(key, fallback string) string {
\tif v := os.Getenv(key); v != "" {
\t\treturn v
\t}
\treturn fallback
}

func requireEnv(key string) string {
\treturn os.Getenv(key)
}

func parseDuration(s string) time.Duration {
\td, err := time.ParseDuration(s)
\tif err != nil {
\t\treturn 0
\t}
\treturn d
}
"""

files["internal/domain/types.go"] = """package domain

import (
\t"encoding/json"
\t"errors"
\t"time"
)

type NodeType string

const (
\tNodeTypeProblem    NodeType = "problem"
\tNodeTypeSolution   NodeType = "solution"
\tNodeTypeDecision   NodeType = "decision"
\tNodeTypeFeature    NodeType = "feature"
\tNodeTypeComponent  NodeType = "component"
\tNodeTypeRisk       NodeType = "risk"
\tNodeTypeTest       NodeType = "test"
\tNodeTypeBenchmark  NodeType = "benchmark"
\tNodeTypeNote       NodeType = "note"
\tNodeTypeLesson     NodeType = "lesson"
\tNodeTypeLink       NodeType = "link"
\tNodeTypeDeployment NodeType = "deployment"
\tNodeTypeLog        NodeType = "log"
)

type Visibility string

const (
\tVisibilityInternal Visibility = "internal"
\tVisibilityShared   Visibility = "shared"
)

type Role string

const (
\tRoleOwner  Role = "owner"
\tRoleEditor Role = "editor"
\tRoleViewer Role = "viewer"
)

type RelationType string

const (
\tRelationTypeDerivesFrom RelationType = "derives_from"
\tRelationTypeSupersedes  RelationType = "supersedes"
\tRelationTypeImplements  RelationType = "implements"
\tRelationTypeValidates   RelationType = "validates"
\tRelationTypeCausedBy    RelationType = "caused_by"
\tRelationTypeDependsOn   RelationType = "depends_on"
\tRelationTypeContradicts RelationType = "contradicts"
\tRelationTypeReferences  RelationType = "references"
\tRelationTypeRelated     RelationType = "related"
)

type User struct {
\tID        string    `json:"id"`
\tEmail     string    `json:"email"`
\tName      string    `json:"name"`
\tAvatarURL string    `json:"avatar_url,omitempty"`
\tCreatedAt time.Time `json:"created_at"`
\tUpdatedAt time.Time `json:"updated_at"`
}

type UserBrief struct {
\tID        string `json:"id"`
\tName      string `json:"name"`
\tAvatarURL string `json:"avatar_url,omitempty"`
}

type Workspace struct {
\tID        string    `json:"id"`
\tName      string    `json:"name"`
\tSlug      string    `json:"slug"`
\tCreatedAt time.Time `json:"created_at"`
\tUpdatedAt time.Time `json:"updated_at"`
}

type Project struct {
\tID          string             `json:"id"`
\tWorkspaceID string             `json:"workspace_id"`
\tName        string             `json:"name"`
\tDescription string             `json:"description,omitempty"`
\tTags        []string           `json:"tags,omitempty"`
\tVisibility  Visibility         `json:"visibility"`
\tStatus      string             `json:"status"`
\tNodeCounts  map[NodeType]int   `json:"node_counts,omitempty"`
\tCreatedAt   time.Time          `json:"created_at"`
\tUpdatedAt   time.Time          `json:"updated_at"`
}

type ProjectMember struct {
\tProjectID string    `json:"project_id"`
\tUserID    string    `json:"user_id"`
\tRole      Role      `json:"role"`
\tCreatedAt time.Time `json:"created_at"`
}

type Node struct {
\tID          string          `json:"id"`
\tProjectID   string          `json:"project_id"`
\tDisplayID   string          `json:"display_id"`
\tType        NodeType        `json:"type"`
\tTitle       string          `json:"title"`
\tContent     string          `json:"content"`
\tVisibility  Visibility      `json:"visibility"`
\tCreatedByID string          `json:"created_by_id"`
\tMeta        json.RawMessage `json:"meta,omitempty"`
\tTags        []string        `json:"tags,omitempty"`
\tCanvasX     float64         `json:"canvas_x,omitempty"`
\tCanvasY     float64         `json:"canvas_y,omitempty"`
\tCreatedAt   time.Time       `json:"created_at"`
\tUpdatedAt   time.Time       `json:"updated_at"`
}

type NodeBrief struct {
\tID        string   `json:"id"`
\tDisplayID string   `json:"display_id"`
\tType      NodeType `json:"type"`
\tTitle     string   `json:"title"`
}

type Relation struct {
\tID          string       `json:"id"`
\tFromNodeID  string       `json:"from_node_id"`
\tToNodeID    string       `json:"to_node_id"`
\tType        RelationType `json:"type"`
\tCreatedByID string       `json:"created_by_id"`
\tCreatedAt   time.Time    `json:"created_at"`
}

type RelationWithNode struct {
\tRelation
\tNode NodeBrief `json:"node"`
}

type Comment struct {
\tID          string      `json:"id"`
\tNodeID      string      `json:"node_id"`
\tParentID    *string     `json:"parent_id,omitempty"`
\tContent     string      `json:"content"`
\tCreatedByID string      `json:"created_by_id"`
\tCreatedAt   time.Time   `json:"created_at"`
\tUpdatedAt   time.Time   `json:"updated_at"`
\tReplies     []Comment   `json:"replies,omitempty"`
\tReactions   []Reaction  `json:"reactions,omitempty"`
}

type Reaction struct {
\tID        string    `json:"id"`
\tCommentID string    `json:"comment_id"`
\tEmoji     string    `json:"emoji"`
\tUserID    string    `json:"user_id"`
\tCreatedAt time.Time `json:"created_at"`
}

type Attachment struct {
\tID          string    `json:"id"`
\tNodeID      string    `json:"node_id"`
\tFilename    string    `json:"filename"`
\tURL         string    `json:"url"`
\tSize        int64     `json:"size"`
\tMimeType    string    `json:"mime_type"`
\tCreatedByID string    `json:"created_by_id"`
\tCreatedAt   time.Time `json:"created_at"`
}

type SearchResult struct {
\tNode    NodeBrief `json:"node"`
\tSnippet string    `json:"snippet"`
\tRank    float64   `json:"rank"`
}

type Meta struct {
\tNextCursor string `json:"next_cursor,omitempty"`
\tHasMore    bool   `json:"has_more"`
\tTotal      int    `json:"total,omitempty"`
}

type CursorPage[T any] struct {
\tData []T  `json:"data"`
\tMeta Meta `json:"meta"`
}

var (
\tErrNotFound     = errors.New("not found")
\tErrUnauthorized = errors.New("unauthorized")
\tErrForbidden    = errors.New("forbidden")
\tErrConflict     = errors.New("conflict")
\tErrBadRequest   = errors.New("bad request")
\tErrInternal     = errors.New("internal error")
)

type AppError struct {
\tHTTPStatus int               `json:"-"`
\tCode       string            `json:"code"`
\tMessage    string            `json:"message"`
\tDetails    map[string]string `json:"details,omitempty"`
}

func (e *AppError) Error() string {
\treturn e.Message
}
"""

files["pkg/id/id.go"] = """package id

import (
\t"encoding/base64"
\t"fmt"
\t"github.com/google/uuid"
\t"strings"
\t"time"
)

func NewID() string {
\treturn uuid.New().String()
}

func NewDisplayID(nodeType string, count int) string {
\tprefix := "N"
\tswitch nodeType {
\tcase "problem": prefix = "P"
\tcase "solution": prefix = "S"
\tcase "decision": prefix = "D"
\tcase "feature": prefix = "F"
\tcase "component": prefix = "C"
\tcase "risk": prefix = "R"
\tcase "test": prefix = "T"
\tcase "benchmark": prefix = "B"
\tcase "note": prefix = "N"
\tcase "lesson": prefix = "L"
\tcase "link": prefix = "K"
\tcase "deployment": prefix = "Y"
\tcase "log": prefix = "G"
\t}
\treturn fmt.Sprintf("%s-%03d", prefix, count)
}

func EncodeCursor(t time.Time, id string) string {
\ts := fmt.Sprintf("%d,%s", t.UnixNano(), id)
\treturn base64.RawURLEncoding.EncodeToString([]byte(s))
}

func DecodeCursor(s string) (time.Time, string, error) {
\tb, err := base64.RawURLEncoding.DecodeString(s)
\tif err != nil {
\t\treturn time.Time{}, "", err
\t}
\tparts := strings.Split(string(b), ",")
\tif len(parts) != 2 {
\t\treturn time.Time{}, "", fmt.Errorf("invalid cursor")
\t}
\tvar ts int64
\tfmt.Sscanf(parts[0], "%d", &ts)
\treturn time.Unix(0, ts), parts[1], nil
}
"""

files["pkg/database/postgres.go"] = """package database

import (
\t"context"
\t"fmt"
\t"sync"
\t"time"

\t"github.com/golang-migrate/migrate/v4"
\t_ "github.com/golang-migrate/migrate/v4/database/postgres"
\t_ "github.com/golang-migrate/migrate/v4/source/file"
\t"github.com/jackc/pgx/v5/pgxpool"
)

type Config struct {
\tURL               string
\tMaxConns          int32
\tMinConns          int32
\tMaxConnIdleTime   time.Duration
\tHealthCheckPeriod time.Duration
}

func NewPool(ctx context.Context, cfg Config) (*pgxpool.Pool, error) {
\tpoolCfg, err := pgxpool.ParseConfig(cfg.URL)
\tif err != nil {
\t\treturn nil, err
\t}

\tpoolCfg.MaxConns = cfg.MaxConns
\tpoolCfg.MinConns = cfg.MinConns
\tpoolCfg.MaxConnIdleTime = cfg.MaxConnIdleTime
\tpoolCfg.HealthCheckPeriod = cfg.HealthCheckPeriod

\tpool, err := pgxpool.NewWithConfig(ctx, poolCfg)
\tif err != nil {
\t\treturn nil, err
\t}

\tif err := warmPool(ctx, pool, int(cfg.MinConns)); err != nil {
\t\treturn nil, err
\t}

\treturn pool, nil
}

func warmPool(ctx context.Context, pool *pgxpool.Pool, n int) error {
\tvar wg sync.WaitGroup
\tfor i := 0; i < n; i++ {
\t\twg.Add(1)
\t\tgo func() {
\t\t\tdefer wg.Done()
\t\t\tpool.Acquire(ctx)
\t\t}()
\t}
\twg.Wait()
\treturn nil
}

func HealthCheck(ctx context.Context, pool *pgxpool.Pool) error {
\t_, err := pool.Exec(ctx, "SELECT 1")
\treturn err
}

func RunMigrations(databaseURL, migrationsPath string) error {
\tm, err := migrate.New("file://"+migrationsPath, databaseURL)
\tif err != nil {
\t\treturn fmt.Errorf("migrate setup failed: %w", err)
\t}
\defer m.Close()
\tif err := m.Up(); err != nil && err != migrate.ErrNoChange {
\t\treturn fmt.Errorf("migrate up failed: %w", err)
\t}
\treturn nil
}
"""

files["db/migrations/001_init.up.sql"] = """
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workspaces (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE workspace_members (
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE projects (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    visibility TEXT NOT NULL CHECK (visibility IN ('internal', 'shared')),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE project_members (
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'editor', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

CREATE TABLE nodes (
    id UUID PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    display_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('problem', 'solution', 'decision', 'feature', 'component', 'risk', 'test', 'benchmark', 'note', 'lesson', 'link', 'deployment', 'log')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    visibility TEXT NOT NULL CHECK (visibility IN ('internal', 'shared')),
    created_by_id UUID NOT NULL REFERENCES users(id),
    meta JSONB DEFAULT '{}'::jsonb,
    tags TEXT[] DEFAULT '{}',
    canvas_x DOUBLE PRECISION,
    canvas_y DOUBLE PRECISION,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(content, '')), 'B')) STORED,
    UNIQUE(project_id, display_id)
);
CREATE TRIGGER nodes_updated_at BEFORE UPDATE ON nodes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE INDEX nodes_search_idx ON nodes USING GIN (search_vector);
CREATE INDEX nodes_project_id_idx ON nodes(project_id);

CREATE TABLE node_relations (
    id UUID PRIMARY KEY,
    from_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    to_node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('derives_from', 'supersedes', 'implements', 'validates', 'caused_by', 'depends_on', 'contradicts', 'references', 'related')),
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(from_node_id, to_node_id, type)
);

CREATE TABLE comments (
    id UUID PRIMARY KEY,
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE comment_reactions (
    id UUID PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id, emoji)
);

CREATE TABLE attachments (
    id UUID PRIMARY KEY,
    node_id UUID NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    created_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
"""

files["db/migrations/001_init.down.sql"] = """
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS comment_reactions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS node_relations CASCADE;
DROP TABLE IF EXISTS nodes CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS update_updated_at();
"""

files["db/queries/nodes.sql"] = """
-- name: CreateNode :one
INSERT INTO nodes (
    id, project_id, display_id, type, title, content, visibility, created_by_id, meta, tags, canvas_x, canvas_y
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
) RETURNING *;

-- name: GetNodeByID :one
SELECT n.* FROM nodes n
JOIN project_members pm ON pm.project_id = n.project_id
WHERE n.id = $1 AND pm.user_id = $2;

-- name: ListNodesByProject :many
SELECT * FROM nodes
WHERE project_id = $1 AND (visibility = 'shared' OR created_by_id = $2 OR EXISTS (SELECT 1 FROM project_members pm WHERE pm.project_id = $1 AND pm.user_id = $2 AND pm.role IN ('owner', 'editor')))
AND created_at < $3
ORDER BY created_at DESC LIMIT $4;

-- name: UpdateNode :one
UPDATE nodes
SET title = COALESCE($2, title),
    content = COALESCE($3, content),
    visibility = COALESCE($4, visibility),
    meta = COALESCE($5, meta),
    tags = COALESCE($6, tags)
WHERE id = $1 RETURNING *;

-- name: DeleteNode :exec
DELETE FROM nodes WHERE id = $1;

-- name: UpdateNodeCanvas :exec
UPDATE nodes SET canvas_x = $2, canvas_y = $3 WHERE id = $1;

-- name: CountNodesByType :many
SELECT type, COUNT(*) FROM nodes WHERE project_id = $1 GROUP BY type;

-- name: GetNextDisplayID :one
SELECT COUNT(*) + 1 FROM nodes WHERE project_id = $1 AND type = $2;
"""

files["db/queries/projects.sql"] = """
-- name: CreateProject :one
INSERT INTO projects (
    id, workspace_id, name, description, tags, visibility, status
) VALUES (
    $1, $2, $3, $4, $5, $6, $7
) RETURNING *;

-- name: GetProjectByID :one
SELECT * FROM projects WHERE id = $1;

-- name: ListProjectsByUser :many
SELECT p.* FROM projects p
JOIN project_members pm ON p.id = pm.project_id
WHERE pm.user_id = $1 AND p.created_at < $2
ORDER BY p.created_at DESC LIMIT $3;

-- name: UpdateProject :one
UPDATE projects
SET name = COALESCE($2, name),
    description = COALESCE($3, description),
    tags = COALESCE($4, tags),
    visibility = COALESCE($5, visibility),
    status = COALESCE($6, status)
WHERE id = $1 RETURNING *;

-- name: DeleteProject :exec
UPDATE projects SET status = 'archived' WHERE id = $1;

-- name: GetProjectMembers :many
SELECT * FROM project_members WHERE project_id = $1;

-- name: AddProjectMember :one
INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3) RETURNING *;

-- name: UpdateProjectMemberRole :one
UPDATE project_members SET role = $3 WHERE project_id = $1 AND user_id = $2 RETURNING *;

-- name: RemoveProjectMember :exec
DELETE FROM project_members WHERE project_id = $1 AND user_id = $2;

-- name: GetUserProjectRole :one
SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2;
"""

files["db/queries/users.sql"] = """
-- name: CreateUser :one
INSERT INTO users (id, email, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: UpdateUser :one
UPDATE users SET name = COALESCE($2, name), avatar_url = COALESCE($3, avatar_url) WHERE id = $1 RETURNING *;
"""

files["db/queries/relations.sql"] = """
-- name: CreateRelation :one
INSERT INTO node_relations (id, from_node_id, to_node_id, type, created_by_id) VALUES ($1, $2, $3, $4, $5) RETURNING *;

-- name: GetRelationsByNode :many
SELECT r.*, n.display_id, n.type as node_type, n.title FROM node_relations r
JOIN nodes n ON n.id = CASE WHEN r.from_node_id = $1 THEN r.to_node_id ELSE r.from_node_id END
WHERE r.from_node_id = $1 OR r.to_node_id = $1;

-- name: DeleteRelation :exec
DELETE FROM node_relations WHERE id = $1;

-- name: GetRelationByID :one
SELECT * FROM node_relations WHERE id = $1;
"""

files["db/queries/comments.sql"] = """
-- name: CreateComment :one
INSERT INTO comments (id, node_id, parent_id, content, created_by_id) VALUES ($1, $2, $3, $4, $5) RETURNING *;

-- name: GetCommentsByNode :many
SELECT * FROM comments WHERE node_id = $1 AND parent_id IS NULL AND created_at < $2 ORDER BY created_at DESC LIMIT $3;

-- name: GetCommentReplies :many
SELECT * FROM comments WHERE parent_id = $1 ORDER BY created_at ASC;

-- name: UpdateComment :one
UPDATE comments SET content = $2 WHERE id = $1 RETURNING *;

-- name: DeleteComment :exec
DELETE FROM comments WHERE id = $1;

-- name: GetCommentByID :one
SELECT * FROM comments WHERE id = $1;

-- name: UpsertReaction :exec
INSERT INTO comment_reactions (id, comment_id, emoji, user_id) VALUES ($1, $2, $3, $4) ON CONFLICT (comment_id, user_id, emoji) DO NOTHING;

-- name: DeleteReaction :exec
DELETE FROM comment_reactions WHERE comment_id = $1 AND user_id = $2 AND emoji = $3;

-- name: GetReactionsByComment :many
SELECT * FROM comment_reactions WHERE comment_id = $1;
"""

files["db/queries/search.sql"] = """
-- name: SearchNodes :many
SELECT id, project_id, display_id, type, title, ts_headline('english', content, q) as snippet,
       ts_rank_cd(search_vector, q) as rank
FROM nodes, to_tsquery('english', $1) q
WHERE search_vector @@ q AND project_id = $2
ORDER BY rank DESC LIMIT $3;

-- name: CountSearchResults :one
SELECT COUNT(*) FROM nodes, to_tsquery('english', $1) q WHERE search_vector @@ q AND project_id = $2;
"""

files["db/queries/attachments.sql"] = """
-- name: CreateAttachment :one
INSERT INTO attachments (id, node_id, filename, url, size, mime_type, created_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- name: GetAttachmentsByNode :many
SELECT * FROM attachments WHERE node_id = $1;

-- name: GetAttachmentByID :one
SELECT * FROM attachments WHERE id = $1;

-- name: DeleteAttachment :exec
DELETE FROM attachments WHERE id = $1;
"""

files["sqlc.yaml"] = """version: "2"
sql:
  - schema: "db/migrations"
    queries: "db/queries"
    engine: "postgresql"
    gen:
      go:
        package: "db"
        out: "internal/db"
        emit_json_tags: true
        emit_prepared_queries: true
        emit_interface: true
        emit_exact_table_names: false
"""

files["pkg/response/response.go"] = """package response

import (
\t"github.com/labstack/echo/v4"
)

type Meta struct {
\tNextCursor string `json:"next_cursor,omitempty"`
\tHasMore    bool   `json:"has_more"`
\tTotal      int    `json:"total,omitempty"`
}

type Response[T any] struct {
\tData T     `json:"data"`
\tMeta *Meta `json:"meta,omitempty"`
}

func Success[T any](data T) Response[T] {
\treturn Response[T]{Data: data}
}

func SuccessWithMeta[T any](data T, meta *Meta) Response[T] {
\treturn Response[T]{Data: data, Meta: meta}
}

type AppError struct {
\tHTTPStatus int               `json:"-"`
\tCode       string            `json:"code"`
\tMessage    string            `json:"message"`
\tDetails    map[string]string `json:"details,omitempty"`
}

func (e *AppError) Error() string {
\treturn e.Message
}

func NewAppError(status int, code, message string) *AppError {
\treturn &AppError{HTTPStatus: status, Code: code, Message: message}
}

func (e *AppError) WithDetails(details map[string]string) *AppError {
\te.Details = details
\treturn e
}

func ErrorHandler(err error, c echo.Context) {
\tif appErr, ok := err.(*AppError); ok {
\t\tc.JSON(appErr.HTTPStatus, appErr)
\t\treturn
\t}
\t
\tif he, ok := err.(*echo.HTTPError); ok {
\t\tc.JSON(he.Code, AppError{Code: "HTTP_ERROR", Message: he.Message.(string)})
\t\treturn
\t}
\t
\tc.JSON(500, AppError{Code: "INTERNAL_ERROR", Message: "Internal Server Error"})
}
"""

files["pkg/middleware/auth.go"] = """package middleware

import (
\t"net/http"
\t"strings"
\t"github.com/golang-jwt/jwt/v5"
\t"github.com/labstack/echo/v4"
\t"synapse/pkg/response"
)

func JWTMiddleware(secret string) echo.MiddlewareFunc {
\treturn func(next echo.HandlerFunc) echo.HandlerFunc {
\t\treturn func(c echo.Context) error {
\t\t\tauthHeader := c.Request().Header.Get("Authorization")
\t\t\tif authHeader == "" {
\t\t\t\treturn response.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "Missing token")
\t\t\t}
\t\t\tparts := strings.Split(authHeader, " ")
\t\t\tif len(parts) != 2 || parts[0] != "Bearer" {
\t\t\t\treturn response.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "Invalid token format")
\t\t\t}
\t\t\ttokenStr := parts[1]
\t\t\t
\t\t\ttoken, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
\t\t\t\treturn []byte(secret), nil
\t\t\t})
\t\t\t
\t\t\tif err != nil || !token.Valid {
\t\t\t\treturn response.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "Invalid token")
\t\t\t}
\t\t\t
\t\t\tclaims, ok := token.Claims.(jwt.MapClaims)
\t\t\tif !ok {
\t\t\t\treturn response.NewAppError(http.StatusUnauthorized, "UNAUTHORIZED", "Invalid claims")
\t\t\t}
\t\t\t
\t\t\tc.Set("user_id", claims["sub"])
\t\t\tc.Set("user_email", claims["email"])
\t\t\tc.Set("role", claims["role"])
\t\t\t
\t\t\treturn next(c)
\t\t}
\t}
}

func GetUserID(c echo.Context) string {
\tv, _ := c.Get("user_id").(string)
\treturn v
}

func GetUserEmail(c echo.Context) string {
\tv, _ := c.Get("user_email").(string)
\treturn v
}
"""

files["pkg/middleware/logger.go"] = """package middleware

import (
\t"log/slog"
\t"time"
\t"github.com/labstack/echo/v4"
\t"github.com/google/uuid"
)

func RequestID() echo.MiddlewareFunc {
\treturn func(next echo.HandlerFunc) echo.HandlerFunc {
\t\treturn func(c echo.Context) error {
\t\t\treqID := c.Request().Header.Get("X-Request-ID")
\t\t\tif reqID == "" {
\t\t\t\treqID = uuid.New().String()
\t\t\t}
\t\t\tc.Response().Header().Set("X-Request-ID", reqID)
\t\t\tc.Set("request_id", reqID)
\t\t\treturn next(c)
\t\t}
\t}
}

func Logger() echo.MiddlewareFunc {
\treturn func(next echo.HandlerFunc) echo.HandlerFunc {
\t\treturn func(c echo.Context) error {
\t\t\tstart := time.Now()
\t\t\terr := next(c)
\t\t\tduration := time.Since(start)
\t\t\t
\t\t\treq := c.Request()
\t\t\tres := c.Response()
\t\t\t
\t\t\treqID, _ := c.Get("request_id").(string)
\t\t\tuserID := GetUserID(c)
\t\t\t
\t\t\targs := []any{
\t\t\t\tslog.String("method", req.Method),
\t\t\t\tslog.String("path", req.URL.Path),
\t\t\t\tslog.Int("status", res.Status),
\t\t\t\tslog.Int64("duration_ms", duration.Milliseconds()),
\t\t\t\tslog.String("request_id", reqID),
\t\t\t\tslog.String("user_id", userID),
\t\t\t}
\t\t\t
\t\t\tif err != nil {
\t\t\t\tc.Error(err)
\t\t\t\targs = append(args, slog.String("error", err.Error()))
\t\t\t}
\t\t\t
\t\t\tif duration > 500*time.Millisecond {
\t\t\t\tslog.Warn("Slow request", args...)
\t\t\t} else {
\t\t\t\tslog.Info("Request handled", args...)
\t\t\t}
\t\t\t
\t\t\treturn nil
\t\t}
\t}
}
"""

files["pkg/middleware/ratelimit.go"] = """package middleware

import (
\t"net/http"
\t"sync"
\t"time"
\t"github.com/labstack/echo/v4"
\t"golang.org/x/time/rate"
\tsynapseresponse "synapse/pkg/response"
)

type visitor struct {
\tlimiter  *rate.Limiter
\tlastSeen time.Time
}

var (
\tvisitors = make(map[string]*visitor)
\tmu       sync.Mutex
)

func init() {
\tgo cleanupVisitors()
}

func cleanupVisitors() {
\tfor {
\t\ttime.Sleep(3 * time.Minute)
\t\tmu.Lock()
\t\tfor ip, v := range visitors {
\t\t\tif time.Since(v.lastSeen) > 3*time.Minute {
\t\t\t\tdelete(visitors, ip)
\t\t\t}
\t\t}
\t\tmu.Unlock()
\t}
}

func RateLimiter(rps float64, burst int) echo.MiddlewareFunc {
\treturn func(next echo.HandlerFunc) echo.HandlerFunc {
\t\treturn func(c echo.Context) error {
\t\t\tip := c.RealIP()
\t\t\t
\t\t\tmu.Lock()
\t\t\tv, exists := visitors[ip]
\t\t\tif !exists {
\t\t\t\tlimiter := rate.NewLimiter(rate.Limit(rps), burst)
\t\t\t\tv = &visitor{limiter: limiter}
\t\t\t\tvisitors[ip] = v
\t\t\t}
\t\t\tv.lastSeen = time.Now()
\t\t\tallow := v.limiter.Allow()
\t\t\tmu.Unlock()
\t\t\t
\t\t\tif !allow {
\t\t\t\treturn synapseresponse.NewAppError(http.StatusTooManyRequests, "RATE_LIMIT_EXCEEDED", "Too many requests")
\t\t\t}
\t\t\treturn next(c)
\t\t}
\t}
}
"""

files["pkg/metrics/metrics.go"] = """package metrics

import (
\t"strconv"
\t"time"
\t"github.com/labstack/echo/v4"
\t"github.com/prometheus/client_golang/prometheus"
)

var (
\tHTTPDuration = prometheus.NewHistogramVec(
\t\tprometheus.HistogramOpts{
\t\t\tName: "http_request_duration_seconds",
\t\t\tHelp: "Duration of HTTP requests.",
\t\t},
\t\t[]string{"method", "path", "status"},
\t)
\tDBDuration = prometheus.NewHistogramVec(
\t\tprometheus.HistogramOpts{
\t\t\tName: "db_query_duration_seconds",
\t\t\tHelp: "Duration of DB queries.",
\t\t},
\t\t[]string{"query"},
\t)
\tWSConnections = prometheus.NewGaugeVec(
\t\tprometheus.GaugeOpts{
\t\t\tName: "ws_connections",
\t\t\tHelp: "Active WebSocket connections.",
\t\t},
\t\t[]string{"project_id"},
\t)
\tWSBroadcastDuration = prometheus.NewHistogram(
\t\tprometheus.HistogramOpts{
\t\t\tName: "ws_broadcast_duration_seconds",
\t\t\tHelp: "Duration to broadcast WebSocket messages.",
\t\t},
\t)
\tNodeCreatedTotal = prometheus.NewCounterVec(
\t\tprometheus.CounterOpts{
\t\t\tName: "node_created_total",
\t\t\tHelp: "Total number of nodes created.",
\t\t},
\t\t[]string{"type"},
\t)
)

func Register() error {
\tprometheus.MustRegister(HTTPDuration)
\tprometheus.MustRegister(DBDuration)
\tprometheus.MustRegister(WSConnections)
\tprometheus.MustRegister(WSBroadcastDuration)
\tprometheus.MustRegister(NodeCreatedTotal)
\treturn nil
}

func HTTPMiddleware() echo.MiddlewareFunc {
\treturn func(next echo.HandlerFunc) echo.HandlerFunc {
\t\treturn func(c echo.Context) error {
\t\t\tstart := time.Now()
\t\t\terr := next(c)
\t\t\tstatus := c.Response().Status
\t\t\tif err != nil {
\t\t\t\tif he, ok := err.(*echo.HTTPError); ok {
\t\t\t\t\tstatus = he.Code
\t\t\t\t}
\t\t\t}
\t\t\tHTTPDuration.WithLabelValues(c.Request().Method, c.Path(), strconv.Itoa(status)).Observe(time.Since(start).Seconds())
\t\t\treturn err
\t\t}
\t}
}
"""

for path, content in files.items():
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
print("Files generated successfully.")
