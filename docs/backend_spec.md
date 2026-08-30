# Synapse API — Техническое задание (Backend)

> **Язык:** Go 1.23+  
> **БД:** PostgreSQL 16  
> **Принцип:** производительность измеряется, а не предполагается — каждый критический путь покрыт бенчмарком

---

## 1. Архитектура

Используем **Clean Architecture** с явным разделением слоёв. Зависимости направлены внутрь: handler → service → repository → database.

```
synapse-api/
├── cmd/
│   └── api/
│       └── main.go               ← точка входа: DI, запуск сервера
│
├── internal/
│   ├── domain/                   ← сущности и интерфейсы (не зависят ни от чего)
│   │   ├── user.go
│   │   ├── project.go
│   │   ├── node.go
│   │   ├── relation.go
│   │   ├── comment.go
│   │   └── attachment.go
│   │
│   ├── auth/
│   │   ├── handler.go
│   │   ├── service.go
│   │   └── service_test.go
│   │
│   ├── project/
│   │   ├── handler.go
│   │   ├── service.go
│   │   ├── repository.go
│   │   └── service_test.go
│   │
│   ├── node/
│   │   ├── handler.go
│   │   ├── service.go
│   │   ├── repository.go
│   │   ├── service_test.go
│   │   └── handler_test.go
│   │
│   ├── search/
│   │   ├── handler.go
│   │   ├── service.go
│   │   └── bench_test.go         ← бенчмарки FTS
│   │
│   └── ws/
│       ├── hub.go                ← WebSocket Hub
│       ├── client.go
│       ├── handler.go
│       └── hub_test.go
│
├── pkg/
│   ├── database/
│   │   ├── postgres.go           ← pgxpool setup
│   │   └── postgres_test.go
│   ├── middleware/
│   │   ├── auth.go
│   │   ├── ratelimit.go
│   │   ├── logger.go
│   │   └── cors.go
│   ├── response/
│   │   └── response.go
│   └── id/
│       └── id.go                 ← UUID + display_id (F-007)
│
├── db/
│   ├── migrations/
│   │   ├── 001_init.up.sql
│   │   └── 001_init.down.sql
│   ├── queries/
│   │   ├── nodes.sql
│   │   ├── projects.sql
│   │   ├── users.sql
│   │   ├── relations.sql
│   │   ├── comments.sql
│   │   └── search.sql
│   └── generated/                ← авто-генерация sqlc (не редактировать)
│
├── tests/
│   ├── integration/
│   │   ├── node_test.go
│   │   ├── project_test.go
│   │   ├── search_test.go
│   │   └── testhelper.go
│   └── bench/
│       ├── api_bench_test.go
│       └── db_bench_test.go
│
├── config/
│   └── config.go                 ← конфиг через env
├── sqlc.yaml
├── Makefile
└── Dockerfile
```

---

## 2. Зависимости (go.mod)

```go
require (
    // HTTP
    github.com/labstack/echo/v4              v4.12+

    // Database
    github.com/jackc/pgx/v5                  v5.6+
    github.com/golang-migrate/migrate/v4     v4.17+
    // sqlc — dev tool, не runtime зависимость

    // Auth
    github.com/golang-jwt/jwt/v5             v5.2+
    golang.org/x/crypto                      latest   // bcrypt

    // WebSocket
    github.com/gorilla/websocket             v1.5+

    // Validation
    github.com/go-playground/validator/v10   v10.20+

    // Testing
    github.com/stretchr/testify              v1.9+
    github.com/testcontainers/testcontainers-go v0.31+

    // Observability
    // log/slog — stdlib (Go 1.21+)
    github.com/prometheus/client_golang      v1.19+

    // Utils
    github.com/google/uuid                   v1.6+
)
```

> [!NOTE]
> **Без ORM.** Только sqlc + raw SQL. ORM скрывает проблемы производительности и генерирует неоптимальные запросы.

---

## 3. Целевые SLO

Все метрики — 50 concurrent requests, 1 core / 1GB RAM:

| Эндпоинт | p50 | p95 | p99 |
|---|---|---|---|
| `GET /api/projects` | < 2ms | < 5ms | < 10ms |
| `GET /api/projects/:id/nodes` | < 3ms | < 8ms | < 15ms |
| `POST /api/nodes` | < 5ms | < 10ms | < 20ms |
| `PATCH /api/nodes/:id` | < 5ms | < 10ms | < 20ms |
| `GET /api/search?q=...` | < 10ms | < 25ms | < 50ms |
| `GET /api/nodes/:id/relations` | < 3ms | < 8ms | < 15ms |
| WebSocket broadcast (50 клиентов) | < 1ms | < 3ms | < 5ms |
| DB: insert node | < 2ms | < 5ms | < 10ms |
| DB: FTS search | < 5ms | < 15ms | < 30ms |

**Пропускная способность:** > 1000 RPS на GET-эндпоинты при 1 core.

---

## 4. Конфигурация (Environment Variables)

```bash
# Server
PORT=3000
ENV=production

# Database
DATABASE_URL=postgres://user:pass@localhost:5432/synapse?sslmode=disable
DB_MAX_CONNS=20
DB_MIN_CONNS=5
DB_MAX_CONN_IDLE_TIME=5m
DB_HEALTH_CHECK_PERIOD=1m

# Auth
JWT_SECRET=<32+ байт>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=168h   # 7 дней

# Files
UPLOAD_DIR=/data/uploads
MAX_FILE_SIZE_MB=50

# WebSocket
WS_MAX_MESSAGE_SIZE=65536
WS_WRITE_WAIT=10s
WS_PONG_WAIT=60s
WS_PING_PERIOD=54s

# Rate limiting
RATE_LIMIT_RPS=100
RATE_LIMIT_BURST=50
```

---

## 5. Database Layer

### pgxpool конфигурация

```go
// pkg/database/postgres.go
func NewPool(ctx context.Context, cfg Config) (*pgxpool.Pool, error) {
    config, err := pgxpool.ParseConfig(cfg.URL)
    if err != nil { return nil, err }

    config.MaxConns = cfg.MaxConns           // 20
    config.MinConns = cfg.MinConns           // 5
    config.MaxConnIdleTime = cfg.MaxConnIdleTime
    config.HealthCheckPeriod = cfg.HealthCheckPeriod

    // Прогреть prepared statements после подключения
    config.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
        return prepareStatements(ctx, conn)
    }

    pool, err := pgxpool.NewWithConfig(ctx, config)
    if err != nil { return nil, err }

    // Warm up
    if err := warmPool(ctx, pool, int(cfg.MinConns)); err != nil {
        return nil, err
    }
    return pool, nil
}

func warmPool(ctx context.Context, pool *pgxpool.Pool, n int) error {
    var wg sync.WaitGroup
    errs := make(chan error, n)
    for i := 0; i < n; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            var v int
            if err := pool.QueryRow(ctx, "SELECT 1").Scan(&v); err != nil {
                errs <- err
            }
        }()
    }
    wg.Wait()
    close(errs)
    return <-errs
}
```

### sqlc конфигурация

```yaml
# sqlc.yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "db/queries/"
    schema: "db/migrations/"
    gen:
      go:
        package: "dbgen"
        out: "db/generated"
        emit_json_tags: true
        emit_prepared_queries: true
        emit_interface: true        # для mock в тестах
        null_style: "option"
```

### Миграция: схема + PostgreSQL тюнинг

```sql
-- db/migrations/001_init.up.sql

-- Сессионные параметры для производительности
SET work_mem = '4MB';
SET maintenance_work_mem = '32MB';

-- Users
CREATE TABLE users (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name         TEXT NOT NULL,
    email        TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    avatar_url   TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Workspaces
CREATE TABLE workspaces (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name       TEXT NOT NULL,
    owner_id   TEXT REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE workspace_members (
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      TEXT REFERENCES users(id) ON DELETE CASCADE,
    role         TEXT NOT NULL CHECK(role IN ('owner','member')),
    PRIMARY KEY (workspace_id, user_id)
);

-- Projects
CREATE TABLE projects (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE,
    name         TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 200),
    status       TEXT DEFAULT 'active' CHECK(status IN ('active','paused','done','archived')),
    type         TEXT CHECK(type IN ('software','hardware','hybrid','research')),
    description  TEXT,
    tags         JSONB DEFAULT '[]',
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE project_members (
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK(role IN ('owner','editor','viewer')),
    invited_by TEXT REFERENCES users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- Nodes (главная таблица)
CREATE TABLE nodes (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id  TEXT REFERENCES projects(id) ON DELETE CASCADE,
    author_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
    type        TEXT NOT NULL CHECK(type IN (
                  'problem','solution','decision','feature','component',
                  'risk','test','benchmark','note','lesson','link','deployment','log'
                )),
    title       TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 500),
    content     TEXT DEFAULT '',
    meta        JSONB DEFAULT '{}',
    status      TEXT,
    visibility  TEXT DEFAULT 'internal' CHECK(visibility IN ('internal','shared')),
    tags        JSONB DEFAULT '[]',
    display_id  TEXT,
    canvas_x    FLOAT DEFAULT 0,
    canvas_y    FLOAT DEFAULT 0,
    -- FTS: автоматически обновляется триггером
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('russian', coalesce(title, '')), 'A') ||
        setweight(to_tsvector('russian', coalesce(content, '')), 'B')
    ) STORED,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Relations
CREATE TABLE node_relations (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    from_node_id TEXT REFERENCES nodes(id) ON DELETE CASCADE,
    to_node_id   TEXT REFERENCES nodes(id) ON DELETE CASCADE,
    type         TEXT NOT NULL CHECK(type IN (
                   'derives_from','supersedes','implements','validates',
                   'caused_by','depends_on','contradicts','references','related'
                 )),
    note         TEXT,
    author_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(from_node_id, to_node_id, type)   -- дублей не допускаем
);

-- Comments
CREATE TABLE comments (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    node_id     TEXT REFERENCES nodes(id) ON DELETE CASCADE,
    author_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
    reply_to_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
    content     TEXT NOT NULL CHECK(length(content) BETWEEN 1 AND 10000),
    edited_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comment_reactions (
    comment_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
    user_id    TEXT REFERENCES users(id) ON DELETE CASCADE,
    emoji      TEXT NOT NULL CHECK(emoji IN ('👍','✅','❓','❤️')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id, emoji)
);

-- Attachments
CREATE TABLE attachments (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    node_id      TEXT REFERENCES nodes(id) ON DELETE CASCADE,
    author_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
    type         TEXT NOT NULL CHECK(type IN ('image','file','embed')),
    filename     TEXT,
    storage_path TEXT,
    embed_url    TEXT,
    mime_type    TEXT,
    size_bytes   BIGINT,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_nodes_project       ON nodes(project_id);
CREATE INDEX idx_nodes_type          ON nodes(type);
CREATE INDEX idx_nodes_visibility    ON nodes(project_id, visibility);
CREATE INDEX idx_nodes_updated       ON nodes(updated_at DESC, id DESC);
CREATE INDEX idx_nodes_search        ON nodes USING GIN(search_vector);
CREATE INDEX idx_nodes_meta          ON nodes USING GIN(meta);
CREATE INDEX idx_relations_from      ON node_relations(from_node_id);
CREATE INDEX idx_relations_to        ON node_relations(to_node_id);
CREATE INDEX idx_comments_node       ON comments(node_id, created_at DESC);
CREATE INDEX idx_comments_reply      ON comments(reply_to_id) WHERE reply_to_id IS NOT NULL;
CREATE INDEX idx_attachments_node    ON attachments(node_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);

-- Функция обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER nodes_updated_at
    BEFORE UPDATE ON nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## 6. Domain Types

```go
// internal/domain/node.go

type NodeType   string
type Visibility string
type Role       string
type RelationType string

const (
    NodeTypeProblem    NodeType = "problem"
    NodeTypeSolution   NodeType = "solution"
    NodeTypeDecision   NodeType = "decision"
    NodeTypeFeature    NodeType = "feature"
    NodeTypeComponent  NodeType = "component"
    NodeTypeRisk       NodeType = "risk"
    NodeTypeTest       NodeType = "test"
    NodeTypeBenchmark  NodeType = "benchmark"
    NodeTypeNote       NodeType = "note"
    NodeTypeLesson     NodeType = "lesson"
    NodeTypeLink       NodeType = "link"
    NodeTypeDeployment NodeType = "deployment"
    NodeTypeLog        NodeType = "log"
)

const (
    VisibilityInternal Visibility = "internal"
    VisibilityShared   Visibility = "shared"
)

const (
    RoleOwner  Role = "owner"
    RoleEditor Role = "editor"
    RoleViewer Role = "viewer"
)

const (
    RelationDerivesFrom  RelationType = "derives_from"
    RelationSupersedes   RelationType = "supersedes"
    RelationImplements   RelationType = "implements"
    RelationValidates    RelationType = "validates"
    RelationCausedBy     RelationType = "caused_by"
    RelationDependsOn    RelationType = "depends_on"
    RelationContradicts  RelationType = "contradicts"
    RelationReferences   RelationType = "references"
    RelationRelated      RelationType = "related"
)

type Node struct {
    ID         string          `json:"id"`
    ProjectID  *string         `json:"project_id"`
    AuthorID   string          `json:"author_id"`
    Type       NodeType        `json:"type"`
    Title      string          `json:"title"`
    Content    string          `json:"content"`
    Meta       json.RawMessage `json:"meta"`
    Status     *string         `json:"status,omitempty"`
    Visibility Visibility      `json:"visibility"`
    Tags       []string        `json:"tags"`
    DisplayID  string          `json:"display_id"`   // "F-007"
    CanvasX    float64         `json:"canvas_x"`
    CanvasY    float64         `json:"canvas_y"`
    CreatedAt  time.Time       `json:"created_at"`
    UpdatedAt  time.Time       `json:"updated_at"`
    Author     *UserBrief      `json:"author,omitempty"`
}

// NodeRepository — интерфейс для mock в тестах
type NodeRepository interface {
    Create(ctx context.Context, input CreateNodeInput) (Node, error)
    GetByID(ctx context.Context, id string, userID string) (Node, Role, error)
    List(ctx context.Context, params ListNodesParams) ([]Node, string, error) // nodes, nextCursor
    Update(ctx context.Context, id string, input UpdateNodeInput) (Node, error)
    Delete(ctx context.Context, id string) error
    UpdateCanvas(ctx context.Context, id string, x, y float64) error
    GetRelations(ctx context.Context, nodeID string) ([]RelationWithNode, error)
    CreateRelation(ctx context.Context, input CreateRelationInput) (Relation, error)
    DeleteRelation(ctx context.Context, id string) error
}
```

---

## 7. API Contract

### Стандартный формат ответа

```go
// pkg/response/response.go

type Response[T any] struct {
    Data T     `json:"data"`
    Meta *Meta `json:"meta,omitempty"`
}

type ErrorResponse struct {
    Error   string            `json:"error"`
    Code    string            `json:"code"`
    Details map[string]string `json:"details,omitempty"`
}

// Cursor-based pagination (НЕ offset)
type Meta struct {
    Cursor  string `json:"cursor,omitempty"`
    HasMore bool   `json:"has_more"`
}
```

### Cursor-based pagination — почему не OFFSET

```sql
-- ПЛОХО: OFFSET 10000 читает 10000 строк и выбрасывает
SELECT * FROM nodes ORDER BY updated_at DESC LIMIT 50 OFFSET 10000;

-- ХОРОШО: keyset pagination — O(log n) по индексу
SELECT * FROM nodes
WHERE (updated_at, id) < ($cursor_time, $cursor_id)
ORDER BY updated_at DESC, id DESC
LIMIT 50;
```

Cursor = base64(updated_at + "|" + id).

### Все эндпоинты

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me

GET    /api/projects
POST   /api/projects
GET    /api/projects/:id
PATCH  /api/projects/:id
DELETE /api/projects/:id
GET    /api/projects/:id/members
POST   /api/projects/:id/members
PATCH  /api/projects/:id/members/:userId
DELETE /api/projects/:id/members/:userId

GET    /api/projects/:id/nodes
POST   /api/projects/:id/nodes
GET    /api/nodes/:id
PATCH  /api/nodes/:id
DELETE /api/nodes/:id
PATCH  /api/nodes/:id/canvas          ← только x,y — быстрый, без broadcast
POST   /api/nodes/:id/lock            ← soft lock
DELETE /api/nodes/:id/lock

GET    /api/nodes/:id/relations
POST   /api/nodes/:id/relations
DELETE /api/relations/:id

GET    /api/search

GET    /api/nodes/:id/comments
POST   /api/nodes/:id/comments
PATCH  /api/comments/:id
DELETE /api/comments/:id
POST   /api/comments/:id/reactions    ← toggle (второй запрос = удалить)

POST   /api/nodes/:id/attachments
GET    /api/attachments/:id/download
DELETE /api/attachments/:id

GET    /health                        ← { "status": "ok", "db": "ok" }
GET    /metrics                       ← Prometheus (только из локалки)
WS     /ws?token=JWT
```

### Visibility enforcement (критично)

```go
// В каждом запросе на список узлов:
func (r *nodeRepo) List(ctx context.Context, p ListNodesParams) ([]Node, string, error) {
    // userRole получается из JWT + project_members JOIN
    // Если role == viewer → автоматически добавляем AND visibility = 'shared'
    // Это делается на уровне SQL, не в Go — нельзя случайно пропустить
}
```

```sql
-- db/queries/nodes.sql
-- name: ListNodesByProject :many
SELECT n.*
FROM nodes n
JOIN project_members pm ON pm.project_id = n.project_id
    AND pm.user_id = @user_id
WHERE n.project_id = @project_id
  AND (
    pm.role != 'viewer'                   -- owner/editor видит всё
    OR n.visibility = 'shared'            -- viewer только shared
  )
  AND (@type_filter::text IS NULL OR n.type = @type_filter)
  AND (n.updated_at, n.id) < (@cursor_time::timestamptz, @cursor_id::text)
ORDER BY n.updated_at DESC, n.id DESC
LIMIT @lim;
```

---

## 8. WebSocket Hub

```go
// internal/ws/hub.go

type Hub struct {
    // projectID → set of clients (map используется только в Run горутине)
    rooms      map[string]map[*Client]struct{}
    register   chan *Client
    unregister chan *Client
    broadcast  chan BroadcastMsg
}

type BroadcastMsg struct {
    ProjectID string
    Event     Event
    ExcludeID string  // не слать инициатору
}

type Event struct {
    Type    string          `json:"type"`
    Payload json.RawMessage `json:"payload"`
}

// Event type constants
const (
    EventNodeCreated   = "node_created"
    EventNodeUpdated   = "node_updated"
    EventNodeDeleted   = "node_deleted"
    EventRelationAdded = "relation_created"
    EventCommentAdded  = "comment_added"
    EventNodeLocked    = "node_locked"
    EventNodeUnlocked  = "node_unlocked"
    EventUserOnline    = "user_online"
)

// Run — единственная горутина работающая с rooms map
// Все операции через каналы — никакого mutex
func (h *Hub) Run() {
    for {
        select {
        case client := <-h.register:
            if _, ok := h.rooms[client.ProjectID]; !ok {
                h.rooms[client.ProjectID] = make(map[*Client]struct{})
            }
            h.rooms[client.ProjectID][client] = struct{}{}

        case client := <-h.unregister:
            if room, ok := h.rooms[client.ProjectID]; ok {
                delete(room, client)
                close(client.send)
            }

        case msg := <-h.broadcast:
            room, ok := h.rooms[msg.ProjectID]
            if !ok { continue }
            data, _ := json.Marshal(msg.Event)
            for client := range room {
                if client.ID == msg.ExcludeID { continue }
                select {
                case client.send <- data:
                default:
                    // Клиент завис — отключить
                    delete(room, client)
                    close(client.send)
                }
            }
        }
    }
}
```

### Soft Lock (in-memory, без БД)

```go
// internal/ws/lockstore.go
type LockStore struct {
    mu    sync.RWMutex
    locks map[string]*Lock  // nodeID → Lock
}

type Lock struct {
    UserID    string
    UserName  string
    ExpiresAt time.Time
}

func (ls *LockStore) Acquire(nodeID, userID, userName string) bool {
    ls.mu.Lock()
    defer ls.mu.Unlock()
    existing, ok := ls.locks[nodeID]
    if ok && existing.UserID != userID && time.Now().Before(existing.ExpiresAt) {
        return false  // занято другим
    }
    ls.locks[nodeID] = &Lock{
        UserID:    userID,
        UserName:  userName,
        ExpiresAt: time.Now().Add(30 * time.Second),
    }
    return true
}

func (ls *LockStore) Release(nodeID, userID string) bool {
    ls.mu.Lock()
    defer ls.mu.Unlock()
    if l, ok := ls.locks[nodeID]; ok && l.UserID == userID {
        delete(ls.locks, nodeID)
        return true
    }
    return false
}

// Запускать в отдельной горутине для очистки протухших лок
func (ls *LockStore) Cleanup(ctx context.Context) {
    ticker := time.NewTicker(10 * time.Second)
    defer ticker.Stop()
    for {
        select {
        case <-ctx.Done(): return
        case <-ticker.C:
            ls.mu.Lock()
            for nodeID, lock := range ls.locks {
                if time.Now().After(lock.ExpiresAt) {
                    delete(ls.locks, nodeID)
                    // TODO: broadcast node_unlocked
                }
            }
            ls.mu.Unlock()
        }
    }
}
```

---

## 9. Search (FTS)

```go
// internal/search/service.go

type SearchResult struct {
    Node    NodeBrief `json:"node"`
    Snippet string    `json:"snippet"`   // 150 символов с <mark> тегами
    Rank    float64   `json:"rank"`
}

type SearchMeta struct {
    Total  int     `json:"total"`
    TookMs float64 `json:"took_ms"`
}
```

```sql
-- db/queries/search.sql
-- name: SearchNodes :many
SELECT
    n.id, n.type, n.title, n.display_id, n.project_id,
    n.visibility, n.status, n.created_at,
    ts_headline(
        'russian',
        coalesce(n.content, ''),
        websearch_to_tsquery('russian', @query),
        'MaxWords=25, MinWords=10, StartSel=<mark>, StopSel=</mark>'
    ) AS snippet,
    ts_rank(n.search_vector, websearch_to_tsquery('russian', @query)) AS rank
FROM nodes n
JOIN project_members pm ON pm.project_id = n.project_id
    AND pm.user_id = @user_id
WHERE n.search_vector @@ websearch_to_tsquery('russian', @query)
  AND (@project_filter::text IS NULL OR n.project_id = @project_filter)
  AND (pm.role != 'viewer' OR n.visibility = 'shared')
ORDER BY rank DESC
LIMIT @lim;
```

> [!TIP]
> `websearch_to_tsquery` (PostgreSQL 11+) понимает `"точная фраза"`, `word1 OR word2`, `-исключить`. Это бесплатно — просто правильный парсинг пользовательского запроса.

---

## 10. Testing

### Unit тесты (mock через интерфейсы)

```go
// internal/node/service_test.go

type mockNodeRepo struct {
    createFn func(ctx context.Context, input CreateNodeInput) (Node, error)
    // ...
}
func (m *mockNodeRepo) Create(ctx context.Context, input CreateNodeInput) (Node, error) {
    return m.createFn(ctx, input)
}

func TestNodeService_Create(t *testing.T) {
    tests := []struct {
        name    string
        input   CreateNodeInput
        mockFn  func(ctx context.Context, input CreateNodeInput) (Node, error)
        wantErr bool
    }{
        {
            name:  "success",
            input: CreateNodeInput{Type: NodeTypeFeature, Title: "Fast search"},
            mockFn: func(_ context.Context, in CreateNodeInput) (Node, error) {
                return Node{ID: "uuid", Type: in.Type, Title: in.Title, DisplayID: "F-001"}, nil
            },
        },
        {
            name:    "empty title rejected",
            input:   CreateNodeInput{Type: NodeTypeFeature, Title: ""},
            wantErr: true,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            svc := NewNodeService(&mockNodeRepo{createFn: tt.mockFn}, &mockHub{})
            node, err := svc.Create(context.Background(), "project-id", "user-id", tt.input)
            if tt.wantErr {
                require.Error(t, err)
                return
            }
            require.NoError(t, err)
            assert.NotEmpty(t, node.ID)
            assert.Equal(t, tt.input.Title, node.Title)
        })
    }
}
```

### Интеграционные тесты (testcontainers)

```go
// tests/integration/testhelper.go

func SetupTestDB(t *testing.T) *pgxpool.Pool {
    t.Helper()
    ctx := context.Background()

    pg, err := postgres.RunContainer(ctx,
        testcontainers.WithImage("postgres:16-alpine"),
        postgres.WithDatabase("synapse_test"),
        postgres.WithUsername("test"),
        postgres.WithPassword("test"),
        testcontainers.WithWaitStrategy(
            wait.ForLog("database system is ready to accept connections").
                WithOccurrence(2).WithStartupTimeout(30*time.Second),
        ),
    )
    require.NoError(t, err)
    t.Cleanup(func() { pg.Terminate(ctx) })

    connStr, _ := pg.ConnectionString(ctx, "sslmode=disable")
    pool, err := NewPool(ctx, Config{URL: connStr, MaxConns: 5, MinConns: 1})
    require.NoError(t, err)
    t.Cleanup(pool.Close)

    // Применить миграции
    RunMigrations(connStr)
    return pool
}

// tests/integration/node_test.go
func TestAPI_NodeVisibility(t *testing.T) {
    pool := SetupTestDB(t)
    app  := SetupTestEcho(pool)

    // Создать проект + 2 пользователя (owner и viewer)
    ownerToken  := registerAndLogin(t, app, "owner@test.com")
    viewerToken := registerAndLogin(t, app, "viewer@test.com")
    project     := createProject(t, app, ownerToken)
    inviteMember(t, app, ownerToken, project.ID, "viewer@test.com", "viewer")

    // Owner создаёт internal узел
    node := createNode(t, app, ownerToken, project.ID, map[string]any{
        "type": "decision", "title": "Secret decision", "visibility": "internal",
    })

    // Viewer НЕ должен видеть internal узел
    t.Run("viewer cannot see internal node", func(t *testing.T) {
        rec := doRequest(t, app, viewerToken, "GET", "/api/nodes/"+node.ID, nil)
        assert.Equal(t, http.StatusNotFound, rec.Code)  // 404, не 403
    })

    // Переключить в shared
    doRequest(t, app, ownerToken, "PATCH", "/api/nodes/"+node.ID,
        map[string]any{"visibility": "shared"})

    // Теперь viewer видит
    t.Run("viewer can see shared node", func(t *testing.T) {
        rec := doRequest(t, app, viewerToken, "GET", "/api/nodes/"+node.ID, nil)
        assert.Equal(t, http.StatusOK, rec.Code)
    })
}
```

### Бенчмарки

```go
// tests/bench/db_bench_test.go

func BenchmarkDB_ListNodes(b *testing.B) {
    // Seed: 1000 узлов в одном проекте
    pool   := setupBenchDB(b, 1000)
    q      := dbgen.New(pool)
    ctx    := context.Background()

    b.ReportAllocs()
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, err := q.ListNodesByProject(ctx, dbgen.ListNodesByProjectParams{
            ProjectID:  pgtype.Text{String: benchProjectID, Valid: true},
            UserID:     benchUserID,
            CursorTime: pgtype.Timestamptz{Time: time.Now(), Valid: true},
            CursorID:   pgtype.Text{String: "zzz", Valid: true},
            Lim:        50,
        })
        if err != nil { b.Fatal(err) }
    }
}

func BenchmarkDB_FTSSearch(b *testing.B) {
    pool  := setupBenchDB(b, 5000)
    ctx   := context.Background()
    terms := []string{"архитектура", "решение", "тест производительности", "MOSFET"}

    b.ReportAllocs()
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        _, err := SearchNodes(ctx, pool, terms[i%len(terms)], nil, benchUserID, 20)
        if err != nil { b.Fatal(err) }
    }
}

func BenchmarkWS_Broadcast50Clients(b *testing.B) {
    hub := NewHub()
    go hub.Run()

    clients := make([]*TestClient, 50)
    for i := range clients {
        clients[i] = hub.AddTestClient("project-id")
    }
    defer func() {
        for _, c := range clients { hub.unregister <- c }
    }()

    payload, _ := json.Marshal(map[string]any{"id": "test", "title": "updated"})
    msg := BroadcastMsg{
        ProjectID: "project-id",
        Event:     Event{Type: EventNodeUpdated, Payload: payload},
    }

    b.ReportAllocs()
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        hub.Broadcast(msg)
        // Дождаться что все клиенты получили (drain буферы)
        for _, c := range clients {
            <-c.received
        }
    }
}

// tests/bench/api_bench_test.go — HTTP уровень
func BenchmarkHTTP_Search(b *testing.B) {
    app  := SetupBenchApp(5000) // 5000 узлов
    tok  := createBenchUser(app)
    urls := []string{
        "/api/search?q=архитектура",
        "/api/search?q=решение+проблемы",
        "/api/search?q=тест",
    }

    b.ReportAllocs()
    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        req := httptest.NewRequest(http.MethodGet, urls[i%len(urls)], nil)
        req.Header.Set("Authorization", "Bearer "+tok)
        rec := httptest.NewRecorder()
        app.ServeHTTP(rec, req)
        if rec.Code != 200 { b.Fatalf("got %d", rec.Code) }
    }
}
```

---

## 11. Makefile

```makefile
.PHONY: build test test-unit test-integration bench lint generate migrate

# Сборка
build:
	CGO_ENABLED=0 go build -ldflags="-s -w" -o bin/synapse-api ./cmd/api

# Все тесты с race detector
test:
	go test ./... -v -race -coverprofile=coverage.out -timeout 120s
	go tool cover -func=coverage.out | grep "total:"

# Только unit (без Docker, быстро)
test-unit:
	go test ./internal/... ./pkg/... -v -race -short

# Интеграционные (нужен Docker)
test-integration:
	go test ./tests/integration/... -v -timeout 180s

# Бенчмарки с записью в файл
bench:
	go test ./tests/bench/... -bench=. -benchmem -benchtime=10s -count=3 \
		| tee bench_results_$(shell date +%Y%m%d_%H%M).txt

# Сравнить два прогона
bench-compare:
	benchstat bench_results_prev.txt bench_results_curr.txt

# CPU профиль
bench-profile:
	go test ./tests/bench/... -bench=$(BENCH) -cpuprofile=cpu.prof -memprofile=mem.prof
	go tool pprof -http=:8080 cpu.prof

# Генерация sqlc
generate:
	sqlc generate

# Миграции
migrate-up:
	migrate -path db/migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path db/migrations -database "$(DATABASE_URL)" down 1

# Линтер
lint:
	golangci-lint run ./... --timeout 5m

# Покрытие HTML
coverage-html:
	go test ./... -coverprofile=coverage.out
	go tool cover -html=coverage.out
```

---

## 12. Logging (slog)

```go
// Каждый запрос логируется:
slog.Info("request",
    "method",      r.Method,
    "path",        r.URL.Path,
    "status",      status,
    "duration_ms", duration.Milliseconds(),
    "request_id",  requestID,
    "user_id",     userID,
)

// Медленный запрос — WARN с деталями
if duration > sloP99[path] {
    slog.Warn("slow request exceeded SLO",
        "path",       path,
        "duration_ms", duration.Milliseconds(),
        "slo_p99_ms", sloP99[path].Milliseconds(),
    )
}

// Ошибка БД — ERROR с полным контекстом
slog.Error("db query failed",
    "query",      queryName,
    "error",      err,
    "duration_ms", duration.Milliseconds(),
    "request_id",  requestID,
)
```

---

## 13. Prometheus Метрики

```go
// pkg/metrics/metrics.go
var (
    HTTPDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "synapse_http_request_duration_seconds",
            Buckets: prometheus.DefBuckets,
        },
        []string{"method", "path", "status"},
    )
    DBDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "synapse_db_query_duration_seconds",
            Buckets: []float64{.0005, .001, .005, .01, .025, .05, .1, .5},
        },
        []string{"query"},
    )
    WSConnections = prometheus.NewGaugeVec(
        prometheus.GaugeOpts{Name: "synapse_ws_connections_total"},
        []string{"project_id"},
    )
    WSBroadcastDuration = prometheus.NewHistogram(prometheus.HistogramOpts{
        Name:    "synapse_ws_broadcast_duration_seconds",
        Buckets: []float64{.00005, .0001, .0005, .001, .005, .01},
    })
    NodeCreatedTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{Name: "synapse_nodes_created_total"},
        []string{"type"},
    )
)
```

---

## 14. Dockerfile

```dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o synapse-api ./cmd/api

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata curl
WORKDIR /app
COPY --from=builder /app/synapse-api .
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1
USER nobody
ENTRYPOINT ["./synapse-api"]
```

---

## 15. Checklist готовности к продакшену

- [ ] `go test -race ./...` — нет race conditions
- [ ] `golangci-lint run` — нет ошибок (errcheck, staticcheck, govet, etc.)
- [ ] Покрытие тестами ≥ 80%: `go tool cover -func=coverage.out`
- [ ] Все бенчмарки укладываются в SLO из раздела 3
- [ ] `EXPLAIN ANALYZE` для каждого SQL-запроса — нет Seq Scan на больших таблицах
- [ ] pgxpool.Stat() под нагрузкой — нет исчерпания пула
- [ ] WebSocket broadcast не блокирует при медленных/зависших клиентах
- [ ] Graceful shutdown: `SIGTERM` → drain in-flight → закрыть pool
- [ ] Все секреты через env, нет хардкода
- [ ] 404 вместо 403 для скрытых ресурсов (не раскрывать существование)
- [ ] Mime-type файлов проверяется по magic bytes, не по Content-Type
- [ ] Rate limiting на auth эндпоинтах: 10 RPS

---

## 16. Порядок разработки

```
1.  pkg/database      → pgxpool + warm up + health check
2.  db/migrations     → полная схема + индексы
3.  db/queries/       → SQL-запросы → sqlc generate
4.  internal/domain/  → типы, константы, интерфейсы репозиториев
5.  config/           → env конфиг
6.  pkg/response/     → стандартные ответы + error handler
7.  pkg/middleware/   → JWT, logger, ratelimit
8.  internal/auth/    → register, login, refresh + тесты
9.  internal/project/ → CRUD + members + тесты
10. internal/node/    → CRUD + visibility + display_id + тесты
11. internal/search/  → FTS + БЕНЧМАРК
12. internal/ws/      → Hub + soft lock + тесты
13. internal/comment/ → треды + реакции
14. internal/attachment → upload + download
15. tests/integration/  → интеграционные тесты всех эндпоинтов
16. tests/bench/        → бенчмарки всех критических путей
17. pkg/metrics/        → Prometheus
18. Dockerfile + docker-compose
```
