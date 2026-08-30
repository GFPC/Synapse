
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
