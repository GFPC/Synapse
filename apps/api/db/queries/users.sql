
-- name: CreateUser :one
INSERT INTO users (id, email, name, avatar_url) VALUES ($1, $2, $3, $4) RETURNING *;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: UpdateUser :one
UPDATE users SET name = COALESCE($2, name), avatar_url = COALESCE($3, avatar_url) WHERE id = $1 RETURNING *;
