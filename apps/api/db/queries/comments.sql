
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
