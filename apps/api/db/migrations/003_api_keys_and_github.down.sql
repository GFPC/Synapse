DROP TABLE IF EXISTS node_pull_requests;
DROP TABLE IF EXISTS node_commits;
ALTER TABLE projects DROP COLUMN IF EXISTS github_repo;
DROP TABLE IF EXISTS api_keys;
