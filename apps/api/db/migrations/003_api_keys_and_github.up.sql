-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    key_hash    TEXT NOT NULL,
    key_prefix  TEXT NOT NULL,
    permissions TEXT[] NOT NULL DEFAULT '{"read","write"}',
    last_used_at TIMESTAMPTZ,
    expires_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_prefix ON api_keys(key_prefix);

-- GitHub Linking & Commits
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo TEXT;

CREATE TABLE IF NOT EXISTS node_commits (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    node_id     TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    commit_hash TEXT NOT NULL,
    message     TEXT NOT NULL,
    author      TEXT NOT NULL,
    branch      TEXT,
    repo_url    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(node_id, commit_hash)
);

CREATE INDEX IF NOT EXISTS idx_node_commits_node ON node_commits(node_id);

CREATE TABLE IF NOT EXISTS node_pull_requests (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    node_id     TEXT NOT NULL REFERENCES nodes(id) ON DELETE CASCADE,
    pr_number   INTEGER NOT NULL,
    pr_url      TEXT NOT NULL,
    title       TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'open',
    author      TEXT,
    merged_at   TIMESTAMPTZ,
    repo_url    TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(node_id, pr_number, repo_url)
);

CREATE INDEX IF NOT EXISTS idx_node_prs_node ON node_pull_requests(node_id);
