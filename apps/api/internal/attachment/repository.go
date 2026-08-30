package attachment

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/synapse/api/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, att domain.Attachment) (domain.Attachment, error)
	GetByNode(ctx context.Context, nodeID string) ([]domain.Attachment, error)
	GetByID(ctx context.Context, id string) (domain.Attachment, error)
	Delete(ctx context.Context, id string) error
}

type pgxRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &pgxRepository{db: db}
}

func (r *pgxRepository) Create(ctx context.Context, att domain.Attachment) (domain.Attachment, error) {
	query := `
		INSERT INTO attachments (node_id, author_id, type, filename, storage_path, embed_url, mime_type, size_bytes, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
		RETURNING id, node_id, author_id, type, filename, storage_path, embed_url, mime_type, size_bytes, created_at
	`
	err := r.db.QueryRow(ctx, query, att.NodeID, att.AuthorID, att.Type, att.Filename, att.StoragePath, att.EmbedURL, att.MimeType, att.SizeBytes).Scan(
		&att.ID, &att.NodeID, &att.AuthorID, &att.Type, &att.Filename, &att.StoragePath, &att.EmbedURL, &att.MimeType, &att.SizeBytes, &att.CreatedAt,
	)
	return att, err
}

func (r *pgxRepository) GetByNode(ctx context.Context, nodeID string) ([]domain.Attachment, error) {
	query := `
		SELECT id, node_id, author_id, type, filename, storage_path, embed_url, mime_type, size_bytes, created_at
		FROM attachments WHERE node_id = $1 ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, query, nodeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var attachments []domain.Attachment
	for rows.Next() {
		var a domain.Attachment
		if err := rows.Scan(&a.ID, &a.NodeID, &a.AuthorID, &a.Type, &a.Filename, &a.StoragePath, &a.EmbedURL, &a.MimeType, &a.SizeBytes, &a.CreatedAt); err != nil {
			return nil, err
		}
		attachments = append(attachments, a)
	}
	return attachments, nil
}

func (r *pgxRepository) GetByID(ctx context.Context, id string) (domain.Attachment, error) {
	query := `
		SELECT id, node_id, author_id, type, filename, storage_path, embed_url, mime_type, size_bytes, created_at
		FROM attachments WHERE id = $1
	`
	var a domain.Attachment
	err := r.db.QueryRow(ctx, query, id).Scan(
		&a.ID, &a.NodeID, &a.AuthorID, &a.Type, &a.Filename, &a.StoragePath, &a.EmbedURL, &a.MimeType, &a.SizeBytes, &a.CreatedAt,
	)
	return a, err
}

func (r *pgxRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM attachments WHERE id = $1`, id)
	return err
}
