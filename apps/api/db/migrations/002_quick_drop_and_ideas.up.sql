-- Migration 002: Quick Drop & Free-Ride Ideas

CREATE TABLE IF NOT EXISTS quick_drops (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'text',
    content TEXT NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quick_drops_user_pinned ON quick_drops(user_id, is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quick_drops_type ON quick_drops(type);

CREATE TABLE IF NOT EXISTS idea_groups (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#6366F1',
    icon TEXT NOT NULL DEFAULT '💡',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_idea_groups_user ON idea_groups(user_id, created_at ASC);

CREATE TABLE IF NOT EXISTS ideas (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    group_id TEXT REFERENCES idea_groups(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    tags TEXT[] NOT NULL DEFAULT '{}',
    color TEXT DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'raw',
    promoted_node_id TEXT REFERENCES nodes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ideas_user_group ON ideas(user_id, group_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);