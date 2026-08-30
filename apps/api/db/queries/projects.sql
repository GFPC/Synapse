-- ============================================================
-- projects.sql — sqlc annotations
-- ============================================================

-- name: CreateProject :one
INSERT INTO projects (workspace_id, name, status, type, description, tags)
VALUES ($1, $2, 'active', $3, $4, $5)
RETURNING id, workspace_id, name, status, type, description, tags, created_at, updated_at;

-- name: GetProjectByID :one
SELECT p.id, p.workspace_id, p.name, p.status, p.type, p.description, p.tags,
       p.created_at, p.updated_at,
       pm.role
FROM projects p
JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $2
WHERE p.id = $1;

-- name: ListProjectsByUser :many
-- Keyset cursor on (updated_at DESC, id DESC)
SELECT p.id, p.workspace_id, p.name, p.status, p.type, p.description, p.tags,
       p.created_at, p.updated_at,
       pm.role
FROM projects p
JOIN project_members pm ON pm.project_id = p.id AND pm.user_id = $1
WHERE (p.updated_at, p.id) < ($2::timestamptz, $3::text)
  AND p.status != 'archived'
ORDER BY p.updated_at DESC, p.id DESC
LIMIT $4;

-- name: UpdateProject :one
UPDATE projects SET
    name        = COALESCE($2, name),
    status      = COALESCE($3, status),
    type        = COALESCE($4, type),
    description = COALESCE($5, description),
    tags        = COALESCE($6, tags)
WHERE id = $1
RETURNING id, workspace_id, name, status, type, description, tags, created_at, updated_at;

-- name: ArchiveProject :exec
UPDATE projects SET status = 'archived' WHERE id = $1;

-- name: GetProjectMembers :many
SELECT pm.project_id, pm.user_id, pm.role, pm.invited_by, pm.invited_at,
       u.name AS user_name, u.email AS user_email, u.avatar_url AS user_avatar
FROM project_members pm
JOIN users u ON u.id = pm.user_id
WHERE pm.project_id = $1
ORDER BY pm.invited_at ASC;

-- name: AddProjectMember :one
INSERT INTO project_members (project_id, user_id, role, invited_by)
VALUES ($1, $2, $3, $4)
RETURNING project_id, user_id, role, invited_by, invited_at;

-- name: UpdateProjectMemberRole :one
UPDATE project_members SET role = $3
WHERE project_id = $1 AND user_id = $2
RETURNING project_id, user_id, role, invited_by, invited_at;

-- name: RemoveProjectMember :exec
DELETE FROM project_members WHERE project_id = $1 AND user_id = $2;

-- name: GetUserProjectRole :one
SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2;

-- name: CountProjectNodesByType :many
SELECT type, COUNT(*)::bigint AS count
FROM nodes
WHERE project_id = $1
GROUP BY type;
