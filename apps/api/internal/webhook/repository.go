package webhook

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/pkg/id"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) FindProjectByRepo(ctx context.Context, repoSlug string) (*domain.Project, error) {
	query := `SELECT id, name, status FROM projects WHERE github_repo = $1 LIMIT 1`
	var p domain.Project
	err := r.pool.QueryRow(ctx, query, repoSlug).Scan(&p.ID, &p.Name, &p.Status)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("find project by repo: %w", err)
	}
	return &p, nil
}

func (r *Repository) FindNodeByDisplayID(ctx context.Context, projectID, displayID string) (*domain.Node, error) {
	query := `SELECT id, project_id, display_id, title, status FROM nodes WHERE project_id = $1 AND UPPER(display_id) = UPPER($2) LIMIT 1`
	var n domain.Node
	err := r.pool.QueryRow(ctx, query, projectID, displayID).Scan(&n.ID, &n.ProjectID, &n.DisplayID, &n.Title, &n.Status)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, domain.ErrNotFound
		}
		return nil, fmt.Errorf("find node by display id: %w", err)
	}
	return &n, nil
}

func (r *Repository) InsertCommit(ctx context.Context, c *domain.NodeCommit) error {
	query := `
		INSERT INTO node_commits (id, node_id, commit_hash, message, author, branch, repo_url, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT (node_id, commit_hash) DO NOTHING
	`
	if c.ID == "" {
		c.ID = id.NewID()
	}
	_, err := r.pool.Exec(ctx, query, c.ID, c.NodeID, c.CommitHash, c.Message, c.Author, c.Branch, c.RepoURL, c.CreatedAt)
	return err
}

func (r *Repository) UpsertPullRequest(ctx context.Context, pr *domain.NodePullRequest) error {
	query := `
		INSERT INTO node_pull_requests (id, node_id, pr_number, pr_url, title, status, author, merged_at, repo_url, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		ON CONFLICT (node_id, pr_number, repo_url) DO UPDATE
		SET status = EXCLUDED.status, title = EXCLUDED.title, merged_at = EXCLUDED.merged_at
	`
	if pr.ID == "" {
		pr.ID = id.NewID()
	}
	_, err := r.pool.Exec(ctx, query, pr.ID, pr.NodeID, pr.PRNumber, pr.PRURL, pr.Title, pr.Status, pr.Author, pr.MergedAt, pr.RepoURL, pr.CreatedAt)
	return err
}

func (r *Repository) UpdateNodeStatus(ctx context.Context, nodeID, status string) error {
	query := `UPDATE nodes SET status = $1, updated_at = now() WHERE id = $2`
	_, err := r.pool.Exec(ctx, query, status, nodeID)
	return err
}
