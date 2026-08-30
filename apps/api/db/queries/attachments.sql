
-- name: CreateAttachment :one
INSERT INTO attachments (id, node_id, filename, url, size, mime_type, created_by_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- name: GetAttachmentsByNode :many
SELECT * FROM attachments WHERE node_id = $1;

-- name: GetAttachmentByID :one
SELECT * FROM attachments WHERE id = $1;

-- name: DeleteAttachment :exec
DELETE FROM attachments WHERE id = $1;
