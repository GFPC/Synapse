package idea

import (
	"context"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/synapse/api/internal/domain"
)

type Repository interface {
	// Groups
	CreateGroup(ctx context.Context, userID string, input domain.CreateIdeaGroupInput) (domain.IdeaGroup, error)
	ListGroups(ctx context.Context, userID string) ([]domain.IdeaGroup, error)
	DeleteGroup(ctx context.Context, id, userID string) error

	// Ideas
	CreateIdea(ctx context.Context, userID string, input domain.CreateIdeaInput) (domain.Idea, error)
	ListIdeas(ctx context.Context, userID string, groupID *string) ([]domain.Idea, error)
	GetIdeaByID(ctx context.Context, id, userID string) (domain.Idea, error)
	UpdateIdea(ctx context.Context, id, userID string, input domain.UpdateIdeaInput) (domain.Idea, error)
	DeleteIdea(ctx context.Context, id, userID string) error
	SetPromotedNodeID(ctx context.Context, ideaID, userID, nodeID string) error
}

type pgxRepository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &pgxRepository{pool: pool}
}

func (r *pgxRepository) CreateGroup(ctx context.Context, userID string, input domain.CreateIdeaGroupInput) (domain.IdeaGroup, error) {
	color := input.Color
	if color == "" {
		color = "#6366F1"
	}
	icon := input.Icon
	if icon == "" {
		icon = "💡"
	}

	query := `
		INSERT INTO idea_groups (user_id, name, color, icon)
		VALUES ($1, $2, $3, $4)
		RETURNING id, user_id, name, color, icon, created_at, updated_at
	`
	var g domain.IdeaGroup
	err := r.pool.QueryRow(ctx, query, userID, input.Name, color, icon).Scan(
		&g.ID,
		&g.UserID,
		&g.Name,
		&g.Color,
		&g.Icon,
		&g.CreatedAt,
		&g.UpdatedAt,
	)
	if err != nil {
		return domain.IdeaGroup{}, err
	}
	return g, nil
}

func (r *pgxRepository) ListGroups(ctx context.Context, userID string) ([]domain.IdeaGroup, error) {
	query := `
		SELECT id, user_id, name, color, icon, created_at, updated_at
		FROM idea_groups
		WHERE user_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.pool.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []domain.IdeaGroup
	for rows.Next() {
		var g domain.IdeaGroup
		err := rows.Scan(
			&g.ID,
			&g.UserID,
			&g.Name,
			&g.Color,
			&g.Icon,
			&g.CreatedAt,
			&g.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}
	if groups == nil {
		groups = []domain.IdeaGroup{}
	}
	return groups, nil
}

func (r *pgxRepository) DeleteGroup(ctx context.Context, id, userID string) error {
	query := `DELETE FROM idea_groups WHERE id = $1 AND user_id = $2`
	ct, err := r.pool.Exec(ctx, query, id, userID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *pgxRepository) CreateIdea(ctx context.Context, userID string, input domain.CreateIdeaInput) (domain.Idea, error) {
	status := input.Status
	if status == "" {
		status = "raw"
	}
	tags := input.Tags
	if tags == nil {
		tags = []string{}
	}

	query := `
		INSERT INTO ideas (user_id, group_id, title, content, tags, color, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, user_id, group_id, title, content, tags, color, status, promoted_node_id, created_at, updated_at
	`
	var item domain.Idea
	err := r.pool.QueryRow(ctx, query, userID, input.GroupID, input.Title, input.Content, tags, input.Color, status).Scan(
		&item.ID,
		&item.UserID,
		&item.GroupID,
		&item.Title,
		&item.Content,
		&item.Tags,
		&item.Color,
		&item.Status,
		&item.PromotedNodeID,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		return domain.Idea{}, err
	}
	return item, nil
}

func (r *pgxRepository) ListIdeas(ctx context.Context, userID string, groupID *string) ([]domain.Idea, error) {
	query := `
		SELECT id, user_id, group_id, title, content, tags, color, status, promoted_node_id, created_at, updated_at
		FROM ideas
		WHERE user_id = $1 AND ($2::text IS NULL OR group_id = $2)
		ORDER BY updated_at DESC
	`
	rows, err := r.pool.Query(ctx, query, userID, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var ideas []domain.Idea
	for rows.Next() {
		var item domain.Idea
		err := rows.Scan(
			&item.ID,
			&item.UserID,
			&item.GroupID,
			&item.Title,
			&item.Content,
			&item.Tags,
			&item.Color,
			&item.Status,
			&item.PromotedNodeID,
			&item.CreatedAt,
			&item.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		ideas = append(ideas, item)
	}
	if ideas == nil {
		ideas = []domain.Idea{}
	}
	return ideas, nil
}

func (r *pgxRepository) GetIdeaByID(ctx context.Context, id, userID string) (domain.Idea, error) {
	query := `
		SELECT id, user_id, group_id, title, content, tags, color, status, promoted_node_id, created_at, updated_at
		FROM ideas
		WHERE id = $1 AND user_id = $2
	`
	var item domain.Idea
	err := r.pool.QueryRow(ctx, query, id, userID).Scan(
		&item.ID,
		&item.UserID,
		&item.GroupID,
		&item.Title,
		&item.Content,
		&item.Tags,
		&item.Color,
		&item.Status,
		&item.PromotedNodeID,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		return domain.Idea{}, domain.ErrNotFound
	}
	return item, nil
}

func (r *pgxRepository) UpdateIdea(ctx context.Context, id, userID string, input domain.UpdateIdeaInput) (domain.Idea, error) {
	query := `
		UPDATE ideas
		SET
			group_id = COALESCE($3, group_id),
			title = COALESCE($4, title),
			content = COALESCE($5, content),
			tags = COALESCE($6, tags),
			color = COALESCE($7, color),
			status = COALESCE($8, status),
			updated_at = NOW()
		WHERE id = $1 AND user_id = $2
		RETURNING id, user_id, group_id, title, content, tags, color, status, promoted_node_id, created_at, updated_at
	`
	var item domain.Idea
	err := r.pool.QueryRow(ctx, query, id, userID, input.GroupID, input.Title, input.Content, input.Tags, input.Color, input.Status).Scan(
		&item.ID,
		&item.UserID,
		&item.GroupID,
		&item.Title,
		&item.Content,
		&item.Tags,
		&item.Color,
		&item.Status,
		&item.PromotedNodeID,
		&item.CreatedAt,
		&item.UpdatedAt,
	)
	if err != nil {
		return domain.Idea{}, domain.ErrNotFound
	}
	return item, nil
}

func (r *pgxRepository) DeleteIdea(ctx context.Context, id, userID string) error {
	query := `DELETE FROM ideas WHERE id = $1 AND user_id = $2`
	ct, err := r.pool.Exec(ctx, query, id, userID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *pgxRepository) SetPromotedNodeID(ctx context.Context, ideaID, userID, nodeID string) error {
	query := `
		UPDATE ideas
		SET promoted_node_id = $3, status = 'matured', updated_at = NOW()
		WHERE id = $1 AND user_id = $2
	`
	_, err := r.pool.Exec(ctx, query, ideaID, userID, nodeID)
	return err
}