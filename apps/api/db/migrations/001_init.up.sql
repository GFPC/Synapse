-- ============================================================
-- Synapse API — Initial Schema (Idempotent)
-- ============================================================

-- ------------------------------------------------------------
-- Helper: auto-update updated_at on any UPDATE
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- Users
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name          TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 200),
    email         TEXT NOT NULL UNIQUE CHECK(length(email) BETWEEN 3 AND 320),
    password_hash TEXT NOT NULL,
    avatar_url    TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS users_updated_at ON users;
CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ------------------------------------------------------------
-- Workspaces (team / company)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspaces (
    id         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name       TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 200),
    owner_id   TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         TEXT NOT NULL CHECK(role IN ('owner', 'member')),
    joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (workspace_id, user_id)
);

-- ------------------------------------------------------------
-- Projects
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name         TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 200),
    status       TEXT NOT NULL DEFAULT 'active'
                      CHECK(status IN ('active', 'paused', 'done', 'archived')),
    type         TEXT CHECK(type IN ('software', 'hardware', 'hybrid', 'research')),
    description  TEXT,
    tags         JSONB NOT NULL DEFAULT '[]',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS projects_updated_at ON projects;
CREATE TRIGGER projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS project_members (
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK(role IN ('owner', 'editor', 'viewer')),
    invited_by TEXT REFERENCES users(id) ON DELETE SET NULL,
    invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (project_id, user_id)
);

-- ------------------------------------------------------------
-- Nodes (the core entity — graph vertices)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS nodes (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    project_id  TEXT REFERENCES projects(id) ON DELETE CASCADE,
    author_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
    type        TEXT NOT NULL CHECK(type IN (
                    'problem', 'solution', 'decision', 'feature', 'component',
                    'risk', 'test', 'benchmark', 'note', 'lesson', 'link',
                    'deployment', 'log'
                )),
    title       TEXT NOT NULL CHECK(length(title) BETWEEN 1 AND 500),
    content     TEXT NOT NULL DEFAULT '',
    meta        JSONB NOT NULL DEFAULT '{}',
    status      TEXT,
    visibility  TEXT NOT NULL DEFAULT 'internal'
                    CHECK(visibility IN ('internal', 'shared')),
    tags        JSONB NOT NULL DEFAULT '[]',
    display_id  TEXT,
    canvas_x    DOUBLE PRECISION NOT NULL DEFAULT 0,
    canvas_y    DOUBLE PRECISION NOT NULL DEFAULT 0,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('russian', coalesce(title,   '')), 'A') ||
        setweight(to_tsvector('russian', coalesce(content, '')), 'B')
    ) STORED,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(project_id, display_id)
);

DROP TRIGGER IF EXISTS nodes_updated_at ON nodes;
CREATE TRIGGER nodes_updated_at
    BEFORE UPDATE ON nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- indexes
CREATE INDEX IF NOT EXISTS idx_nodes_project    ON nodes(project_id);
CREATE INDEX IF NOT EXISTS idx_nodes_type       ON nodes(type);
CREATE INDEX IF NOT EXISTS idx_nodes_visibility ON nodes(project_id, visibility);
CREATE INDEX IF NOT EXISTS idx_nodes_updated    ON nodes(updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_nodes_search     ON nodes USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_nodes_meta       ON nodes USING GIN(meta);
CREATE INDEX IF NOT EXISTS idx_nodes_author     ON nodes(author_id);

-- ------------------------------------------------------------
-- Node Relations (graph edges)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS node_relations (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    from_node_id TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    to_node_id   TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    type         TEXT NOT NULL CHECK(type IN (
                     'derives_from', 'supersedes', 'implements', 'validates',
                     'caused_by', 'depends_on', 'contradicts', 'references', 'related'
                 )),
    note         TEXT,
    author_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(from_node_id, to_node_id, type)
);

CREATE INDEX IF NOT EXISTS idx_relations_from ON node_relations(from_node_id);
CREATE INDEX IF NOT EXISTS idx_relations_to   ON node_relations(to_node_id);

-- ------------------------------------------------------------
-- Comments (threaded)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comments (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    node_id     TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    author_id   TEXT REFERENCES users(id) ON DELETE SET NULL,
    reply_to_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
    content     TEXT NOT NULL CHECK(length(content) BETWEEN 1 AND 10000),
    edited_at   TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_node  ON comments(node_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_reply ON comments(reply_to_id) WHERE reply_to_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS comment_reactions (
    comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    emoji      TEXT NOT NULL CHECK(emoji IN ('👍', '✅', '❓', '❤️')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (comment_id, user_id, emoji)
);

-- ------------------------------------------------------------
-- Attachments
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attachments (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    node_id      TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    author_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
    type         TEXT NOT NULL CHECK(type IN ('image', 'file', 'embed')),
    filename     TEXT,
    storage_path TEXT,
    embed_url    TEXT,
    mime_type    TEXT,
    size_bytes   BIGINT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_node ON attachments(node_id);

-- ------------------------------------------------------------
-- Additional indexes for performance
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_project_members_user    ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user  ON workspace_members(user_id);
