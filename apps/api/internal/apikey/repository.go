package apikey

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/synapse/api/internal/domain"
)

type Repository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{pool: pool}
}

func (r *Repository) Create(ctx context.Context, key *domain.ApiKey) error {
	query := `
		INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, permissions, expires_at, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`
	return r.pool.QueryRow(ctx, query,
		key.ID,
		key.UserID,
		key.Name,
		key.KeyHash,
		key.KeyPrefix,
		key.Permissions,
		key.ExpiresAt,
		key.CreatedAt,
	).Scan(&key.ID, &key.CreatedAt)
}

func (r *Repository) ListByUser(ctx context.Context, userID string) ([]domain.ApiKey, error) {
	query := `
		SELECT id, user_id, name, key_prefix, permissions, last_used_at, expires_at, created_at
		FROM api_keys
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("list api keys: %w", err)
	}
	defer rows.Close()

	var keys []domain.ApiKey
	for rows.Next() {
		var k domain.ApiKey
		if err := rows.Scan(
			&k.ID,
			&k.UserID,
			&k.Name,
			&k.KeyPrefix,
			&k.Permissions,
			&k.LastUsedAt,
			&k.ExpiresAt,
			&k.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan api key: %w", err)
		}
		keys = append(keys, k)
	}
	return keys, nil
}

func (r *Repository) GetByPrefix(ctx context.Context, prefix string) ([]domain.ApiKey, error) {
	query := `
		SELECT id, user_id, name, key_hash, key_prefix, permissions, last_used_at, expires_at, created_at
		FROM api_keys
		WHERE key_prefix = $1
	`
	rows, err := r.pool.Query(ctx, query, prefix)
	if err != nil {
		return nil, fmt.Errorf("get api keys by prefix: %w", err)
	}
	defer rows.Close()

	var keys []domain.ApiKey
	for rows.Next() {
		var k domain.ApiKey
		if err := rows.Scan(
			&k.ID,
			&k.UserID,
			&k.Name,
			&k.KeyHash,
			&k.KeyPrefix,
			&k.Permissions,
			&k.LastUsedAt,
			&k.ExpiresAt,
			&k.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan api key: %w", err)
		}
		keys = append(keys, k)
	}
	return keys, nil
}

func (r *Repository) Delete(ctx context.Context, id, userID string) error {
	query := `DELETE FROM api_keys WHERE id = $1 AND user_id = $2`
	tag, err := r.pool.Exec(ctx, query, id, userID)
	if err != nil {
		return fmt.Errorf("delete api key: %w", err)
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *Repository) UpdateLastUsed(ctx context.Context, id string) {
	now := time.Now()
	_, _ = r.pool.Exec(ctx, `UPDATE api_keys SET last_used_at = $1 WHERE id = $2`, now, id)
}

func (r *Repository) GetUserEmail(ctx context.Context, userID string) (string, error) {
	var email string
	err := r.pool.QueryRow(ctx, `SELECT email FROM users WHERE id = $1`, userID).Scan(&email)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "", domain.ErrNotFound
		}
		return "", err
	}
	return email, nil
}
