package comment

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/synapse/api/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, nodeID, authorID string, replyToID *string, content string) (domain.Comment, error)
	GetByNode(ctx context.Context, nodeID string, cursor string, limit int) ([]domain.Comment, string, bool, error)
	GetByID(ctx context.Context, id string) (domain.Comment, error)
	Update(ctx context.Context, id, content string) (domain.Comment, error)
	Delete(ctx context.Context, id string) error
	GetReplies(ctx context.Context, commentID string) ([]domain.Comment, error)
	UpsertReaction(ctx context.Context, commentID, userID, emoji string) (added bool, err error)
	GetReactions(ctx context.Context, commentID string) ([]domain.Reaction, error)
	GetAuthor(ctx context.Context, commentID string) (string, error)
}

type pgxRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &pgxRepository{db: db}
}

func (r *pgxRepository) Create(ctx context.Context, nodeID, authorID string, replyToID *string, content string) (domain.Comment, error) {
	var c domain.Comment
	query := `
		INSERT INTO comments (node_id, author_id, reply_to_id, content, created_at)
		VALUES ($1, $2, $3, $4, NOW())
		RETURNING id, node_id, author_id, reply_to_id, content, edited_at, created_at
	`
	err := r.db.QueryRow(ctx, query, nodeID, authorID, replyToID, content).Scan(
		&c.ID, &c.NodeID, &c.AuthorID, &c.ReplyToID, &c.Content, &c.EditedAt, &c.CreatedAt,
	)
	return c, err
}

func (r *pgxRepository) GetByNode(ctx context.Context, nodeID string, cursor string, limit int) ([]domain.Comment, string, bool, error) {
	query := `
		SELECT c.id, c.node_id, c.author_id, c.reply_to_id, c.content, c.edited_at, c.created_at,
		       u.id, u.name, COALESCE(u.avatar_url, '')
		FROM comments c
		LEFT JOIN users u ON c.author_id = u.id
		WHERE c.node_id = $1 AND c.reply_to_id IS NULL
	`
	args := []any{nodeID}
	
	if cursor != "" {
		query += ` AND c.id > $2`
		args = append(args, cursor)
	}
	
	query += fmt.Sprintf(` ORDER BY c.created_at ASC, c.id ASC LIMIT %d`, limit+1)

	rows, err := r.db.Query(ctx, query, args...)
	if err != nil {
		return nil, "", false, err
	}
	defer rows.Close()

	var comments []domain.Comment
	for rows.Next() {
		var c domain.Comment
		var u domain.UserBrief
		if err := rows.Scan(
			&c.ID, &c.NodeID, &c.AuthorID, &c.ReplyToID, &c.Content, &c.EditedAt, &c.CreatedAt,
			&u.ID, &u.Name, &u.AvatarURL,
		); err != nil {
			return nil, "", false, err
		}
		c.Author = &u
		comments = append(comments, c)
	}

	hasMore := false
	nextCursor := ""
	if len(comments) > limit {
		hasMore = true
		comments = comments[:limit]
	}
	if len(comments) > 0 {
		nextCursor = comments[len(comments)-1].ID
	}

	for i := range comments {
		reactions, err := r.GetReactions(ctx, comments[i].ID)
		if err == nil {
			comments[i].Reactions = reactions
		}
	}

	return comments, nextCursor, hasMore, nil
}

func (r *pgxRepository) GetByID(ctx context.Context, id string) (domain.Comment, error) {
	var c domain.Comment
	query := `
		SELECT id, node_id, author_id, reply_to_id, content, edited_at, created_at
		FROM comments WHERE id = $1
	`
	err := r.db.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.NodeID, &c.AuthorID, &c.ReplyToID, &c.Content, &c.EditedAt, &c.CreatedAt,
	)
	return c, err
}

func (r *pgxRepository) Update(ctx context.Context, id, content string) (domain.Comment, error) {
	var c domain.Comment
	query := `
		UPDATE comments SET content = $1, edited_at = NOW()
		WHERE id = $2
		RETURNING id, node_id, author_id, reply_to_id, content, edited_at, created_at
	`
	err := r.db.QueryRow(ctx, query, content, id).Scan(
		&c.ID, &c.NodeID, &c.AuthorID, &c.ReplyToID, &c.Content, &c.EditedAt, &c.CreatedAt,
	)
	return c, err
}

func (r *pgxRepository) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, `DELETE FROM comments WHERE id = $1`, id)
	return err
}

func (r *pgxRepository) GetReplies(ctx context.Context, commentID string) ([]domain.Comment, error) {
	query := `
		SELECT c.id, c.node_id, c.author_id, c.reply_to_id, c.content, c.edited_at, c.created_at,
		       u.id, u.name, COALESCE(u.avatar_url, '')
		FROM comments c
		LEFT JOIN users u ON c.author_id = u.id
		WHERE c.reply_to_id = $1
		ORDER BY c.created_at ASC
	`
	rows, err := r.db.Query(ctx, query, commentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []domain.Comment
	for rows.Next() {
		var c domain.Comment
		var u domain.UserBrief
		if err := rows.Scan(
			&c.ID, &c.NodeID, &c.AuthorID, &c.ReplyToID, &c.Content, &c.EditedAt, &c.CreatedAt,
			&u.ID, &u.Name, &u.AvatarURL,
		); err != nil {
			return nil, err
		}
		c.Author = &u
		comments = append(comments, c)
	}

	for i := range comments {
		reactions, err := r.GetReactions(ctx, comments[i].ID)
		if err == nil {
			comments[i].Reactions = reactions
		}
	}

	return comments, nil
}

func (r *pgxRepository) UpsertReaction(ctx context.Context, commentID, userID, emoji string) (bool, error) {
	var exists bool
	err := r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM comment_reactions WHERE comment_id = $1 AND user_id = $2 AND emoji = $3)`, commentID, userID, emoji).Scan(&exists)
	if err != nil {
		return false, err
	}

	if exists {
		_, err = r.db.Exec(ctx, `DELETE FROM comment_reactions WHERE comment_id = $1 AND user_id = $2 AND emoji = $3`, commentID, userID, emoji)
		return false, err
	}

	_, err = r.db.Exec(ctx, `INSERT INTO comment_reactions (comment_id, user_id, emoji) VALUES ($1, $2, $3)`, commentID, userID, emoji)
	return true, err
}

func (r *pgxRepository) GetReactions(ctx context.Context, commentID string) ([]domain.Reaction, error) {
	query := `SELECT comment_id, user_id, emoji, created_at FROM comment_reactions WHERE comment_id = $1`
	rows, err := r.db.Query(ctx, query, commentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reactions []domain.Reaction
	for rows.Next() {
		var react domain.Reaction
		if err := rows.Scan(&react.CommentID, &react.UserID, &react.Emoji, &react.CreatedAt); err != nil {
			return nil, err
		}
		reactions = append(reactions, react)
	}
	return reactions, nil
}

func (r *pgxRepository) GetAuthor(ctx context.Context, commentID string) (string, error) {
	var authorID string
	err := r.db.QueryRow(ctx, `SELECT author_id FROM comments WHERE id = $1`, commentID).Scan(&authorID)
	return authorID, err
}
