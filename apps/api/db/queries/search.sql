
-- name: SearchNodes :many
SELECT id, project_id, display_id, type, title, ts_headline('english', content, q) as snippet,
       ts_rank_cd(search_vector, q) as rank
FROM nodes, to_tsquery('english', $1) q
WHERE search_vector @@ q AND project_id = $2
ORDER BY rank DESC LIMIT $3;

-- name: CountSearchResults :one
SELECT COUNT(*) FROM nodes, to_tsquery('english', $1) q WHERE search_vector @@ q AND project_id = $2;
