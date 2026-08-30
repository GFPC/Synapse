-- ============================================================
-- nodes.sql — sqlc annotations
-- Actual inline SQL used by pgxRepository in node/repository.go
-- ============================================================

-- name: CreateNode :one
INSERT INTO nodes (
    project_id, author_id, type, title, content,
    meta, status, visibility, tags, canvas_x, canvas_y
) VALUES (
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
) RETURNING
    id, project_id, author_id, type, title, content,
    meta, status, visibility, tags, display_id,
    canvas_x, canvas_y, created_at, updated_at;

-- name: GetNodeByID :one
SELECT
    n.id, n.project_id, n.author_id, n.type, n.title, n.content,
    n.meta, n.status, n.visibility, n.tags, n.display_id,
    n.canvas_x, n.canvas_y, n.created_at, n.updated_at,
    COALESCE(pm.role, 'viewer') AS role
FROM nodes n
LEFT JOIN project_members pm
    ON pm.project_id = n.project_id AND pm.user_id = $2
WHERE n.id = $1;

-- name: ListNodesByProject :many
-- Cursor-based (keyset) pagination on (updated_at DESC, id DESC)
-- Visibility: viewer sees only 'shared', owner/editor sees all
SELECT
    n.id, n.project_id, n.author_id, n.type, n.title, n.content,
    n.meta, n.status, n.visibility, n.tags, n.display_id,
    n.canvas_x, n.canvas_y, n.created_at, n.updated_at
FROM nodes n
JOIN project_members pm
    ON pm.project_id = n.project_id AND pm.user_id = $1
WHERE n.project_id = $2
  AND (pm.role != 'viewer' OR n.visibility = 'shared')
  AND ($3::text IS NULL OR n.type = $3)
  AND (n.updated_at, n.id) < ($4::timestamptz, $5::text)
ORDER BY n.updated_at DESC, n.id DESC
LIMIT $6;

-- name: UpdateNode :one
UPDATE nodes SET
    title      = COALESCE($2, title),
    content    = COALESCE($3, content),
    meta       = COALESCE($4, meta),
    status     = COALESCE($5, status),
    visibility = COALESCE($6, visibility),
    tags       = COALESCE($7, tags)
WHERE id = $1
RETURNING
    id, project_id, author_id, type, title, content,
    meta, status, visibility, tags, display_id,
    canvas_x, canvas_y, created_at, updated_at;

-- name: DeleteNode :exec
DELETE FROM nodes WHERE id = $1;

-- name: UpdateNodeCanvas :exec
UPDATE nodes SET canvas_x = $2, canvas_y = $3 WHERE id = $1;

-- name: CountNodesByType :many
SELECT type, COUNT(*)::bigint AS count
FROM nodes
WHERE project_id = $1
GROUP BY type;

-- name: GetNextDisplayIDNum :one
-- Returns the next sequential number for display_id generation (e.g., 7 → "F-007")
SELECT COUNT(*)::int + 1 AS next_num
FROM nodes
WHERE project_id = $1 AND type = $2;

-- name: SetDisplayID :exec
UPDATE nodes SET display_id = $2 WHERE id = $1;
