package quickdrop

import (
	"context"
	"encoding/json"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/synapse/api/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, userID string, input domain.CreateQuickDropInput) (domain.QuickDrop, error)
	ListByUser(ctx context.Context, userID string, limit int) ([]domain.QuickDrop, error)
	TogglePin(ctx context.Context, id, userID string) (domain.QuickDrop, error)
	Delete(ctx context.Context, id, userID string) error
	ClearUnpinned(ctx context.Context, userID string) error
}

type pgxRepository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &pgxRepository{pool: pool}
}

func (r *pgxRepository) Create(ctx context.Context, userID string, input domain.CreateQuickDropInput) (domain.QuickDrop, error) {
	meta := input.Metadata
	if len(meta) == 0 {
		meta = json.RawMessage("{}")
	}

	query := `
		INSERT INTO quick_drops (user_id, type, content, metadata, is_pinned)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, user_id, type, content, metadata, is_pinned, created_at, updated_at
	`
	var qd domain.QuickDrop
	err := r.pool.QueryRow(ctx, query, userID, input.Type, input.Content, meta, input.IsPinned).Scan(
		&qd.ID,
		&qd.UserID,
		&qd.Type,
		&qd.Content,
		&qd.Metadata,
		&qd.IsPinned,
		&qd.CreatedAt,
		&qd.UpdatedAt,
	)
	if err != nil {
		return domain.QuickDrop{}, err
	}
	return qd, nil
}

func (r *pgxRepository) ListByUser(ctx context.Context, userID string, limit int) ([]domain.QuickDrop, error) {
	if limit <= 0 || limit > 200 {
		limit = 100
	}

	query := `
		SELECT id, user_id, type, content, metadata, is_pinned, created_at, updated_at
		FROM quick_drops
		WHERE user_id = $1
		ORDER BY is_pinned DESC, created_at DESC
		LIMIT $2
	`
	rows, err := r.pool.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []domain.QuickDrop
	for rows.Next() {
		var qd domain.QuickDrop
		err := rows.Scan(
			&qd.ID,
			&qd.UserID,
			&qd.Type,
			&qd.Content,
			&qd.Metadata,
			&qd.IsPinned,
			&qd.CreatedAt,
			&qd.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		items = append(items, qd)
	}
	if items == nil {
		items = []domain.QuickDrop{}
	}
	return items, nil
}

func (r *pgxRepository) TogglePin(ctx context.Context, id, userID string) (domain.QuickDrop, error) {
	query := `
		UPDATE quick_drops
		SET is_pinned = NOT is_pinned, updated_at = NOW()
		WHERE id = $1 AND user_id = $2
		RETURNING id, user_id, type, content, metadata, is_pinned, created_at, updated_at
	`
	var qd domain.QuickDrop
	err := r.pool.QueryRow(ctx, query, id, userID).Scan(
		&qd.ID,
		&qd.UserID,
		&qd.Type,
		&qd.Content,
		&qd.Metadata,
		&qd.IsPinned,
		&qd.CreatedAt,
		&qd.UpdatedAt,
	)
	if err != nil {
		return domain.QuickDrop{}, domain.ErrNotFound
	}
	return qd, nil
}

func (r *pgxRepository) Delete(ctx context.Context, id, userID string) error {
	query := `DELETE FROM quick_drops WHERE id = $1 AND user_id = $2`
	ct, err := r.pool.Exec(ctx, query, id, userID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *pgxRepository) ClearUnpinned(ctx context.Context, userID string) error {
	query := `DELETE FROM quick_drops WHERE user_id = $1 AND is_pinned = FALSE`
	_, err := r.pool.Exec(ctx, query, userID)
	return err
}