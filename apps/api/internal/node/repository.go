package node

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/pkg/id"
)

type Repository interface {
	Create(ctx context.Context, projectID, authorID string, input domain.CreateNodeInput) (domain.Node, error)
	GetByID(ctx context.Context, id, userID string) (domain.Node, domain.Role, error)
	List(ctx context.Context, params domain.ListNodesParams) ([]domain.Node, string, bool, error)
	Update(ctx context.Context, id string, input domain.UpdateNodeInput) (domain.Node, error)
	Delete(ctx context.Context, id string) error
	UpdateCanvas(ctx context.Context, id string, x, y float64) error
	CreateRelation(ctx context.Context, fromID, toID string, relType domain.RelationType, note *string, authorID string) (domain.Relation, error)
	GetRelations(ctx context.Context, nodeID string) ([]domain.RelationWithNode, error)
	DeleteRelation(ctx context.Context, id, userID string) error
	GetNextDisplayIDNum(ctx context.Context, projectID string, nodeType domain.NodeType) (int, error)
}

type pgxRepository struct {
	db *pgxpool.Pool
}

func NewRepository(db *pgxpool.Pool) Repository {
	return &pgxRepository{db: db}
}

func (r *pgxRepository) GetNextDisplayIDNum(ctx context.Context, projectID string, nodeType domain.NodeType) (int, error) {
	var count int
	err := r.db.QueryRow(ctx, `SELECT COUNT(*) + 1 FROM nodes WHERE project_id = $1 AND type = $2`, projectID, nodeType).Scan(&count)
	return count, err
}

func (r *pgxRepository) Create(ctx context.Context, projectID, authorID string, input domain.CreateNodeInput) (domain.Node, error) {
	count, err := r.GetNextDisplayIDNum(ctx, projectID, input.Type)
	if err != nil {
		count = 1
	}
	displayID := id.NewDisplayID(string(input.Type), count)

	tagsJSON, err := json.Marshal(input.Tags)
	if err != nil {
		tagsJSON = []byte("[]")
	}
	metaJSON := input.Meta
	if len(metaJSON) == 0 {
		metaJSON = []byte("{}")
	}

	q := `INSERT INTO nodes (project_id, author_id, type, title, content, meta, status, visibility, tags, display_id, canvas_x, canvas_y)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING id, project_id, author_id, type, title, content, meta, status, visibility, tags, display_id, canvas_x, canvas_y, created_at, updated_at`

	var node domain.Node
	var tagsRaw []byte
	err = r.db.QueryRow(ctx, q, projectID, authorID, input.Type, input.Title, input.Content, metaJSON, input.Status, input.Visibility, tagsJSON, displayID, input.CanvasX, input.CanvasY).
		Scan(&node.ID, &node.ProjectID, &node.AuthorID, &node.Type, &node.Title, &node.Content, &node.Meta, &node.Status, &node.Visibility, &tagsRaw, &node.DisplayID, &node.CanvasX, &node.CanvasY, &node.CreatedAt, &node.UpdatedAt)
	if err != nil {
		return domain.Node{}, err
	}
	_ = json.Unmarshal(tagsRaw, &node.Tags)
	return node, nil
}

func (r *pgxRepository) GetByID(ctx context.Context, id, userID string) (domain.Node, domain.Role, error) {
	q := `SELECT n.id, n.project_id, n.author_id, n.type, n.title, n.content, n.meta, n.status, n.visibility, n.tags, n.display_id, n.canvas_x, n.canvas_y, n.created_at, n.updated_at,
	             COALESCE(pm.role, 'viewer') as role
		FROM nodes n
		LEFT JOIN project_members pm ON pm.project_id = n.project_id AND pm.user_id = $2
		WHERE n.id = $1`

	var node domain.Node
	var role domain.Role
	var tagsRaw []byte
	err := r.db.QueryRow(ctx, q, id, userID).
		Scan(&node.ID, &node.ProjectID, &node.AuthorID, &node.Type, &node.Title, &node.Content, &node.Meta, &node.Status, &node.Visibility, &tagsRaw, &node.DisplayID, &node.CanvasX, &node.CanvasY, &node.CreatedAt, &node.UpdatedAt, &role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Node{}, "", domain.ErrNotFound
		}
		return domain.Node{}, "", err
	}
	_ = json.Unmarshal(tagsRaw, &node.Tags)
	return node, role, nil
}

func (r *pgxRepository) List(ctx context.Context, params domain.ListNodesParams) ([]domain.Node, string, bool, error) {
	q := `SELECT n.id, n.project_id, n.author_id, n.type, n.title, n.content, n.meta, n.status, n.visibility, n.tags, n.display_id, n.canvas_x, n.canvas_y, n.created_at, n.updated_at
		FROM nodes n
		LEFT JOIN project_members pm ON pm.project_id = n.project_id AND pm.user_id = $2
		WHERE n.project_id = $1
		  AND (COALESCE(pm.role, 'owner') != 'viewer' OR n.visibility = 'shared')
	`
	args := []interface{}{params.ProjectID, params.UserID}
	argIdx := 3

	if params.TypeFilter != "" {
		q += ` AND n.type = $` + string(rune('0'+argIdx))
		args = append(args, params.TypeFilter)
		argIdx++
	}

	if params.Cursor != "" {
		q += ` AND n.id > $` + string(rune('0'+argIdx))
		args = append(args, params.Cursor)
		argIdx++
	}

	limit := params.Limit
	if limit <= 0 {
		limit = 50
	}
	q += ` ORDER BY n.id ASC LIMIT $` + string(rune('0'+argIdx))
	args = append(args, limit+1)

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, "", false, err
	}
	defer rows.Close()

	var nodes []domain.Node
	for rows.Next() {
		var n domain.Node
		var tagsRaw []byte
		if err := rows.Scan(&n.ID, &n.ProjectID, &n.AuthorID, &n.Type, &n.Title, &n.Content, &n.Meta, &n.Status, &n.Visibility, &tagsRaw, &n.DisplayID, &n.CanvasX, &n.CanvasY, &n.CreatedAt, &n.UpdatedAt); err != nil {
			return nil, "", false, err
		}
		_ = json.Unmarshal(tagsRaw, &n.Tags)
		nodes = append(nodes, n)
	}

	hasMore := false
	nextCursor := ""
	if len(nodes) > limit {
		hasMore = true
		nodes = nodes[:limit]
	}
	if len(nodes) > 0 {
		nextCursor = nodes[len(nodes)-1].ID
	}

	return nodes, nextCursor, hasMore, nil
}

func (r *pgxRepository) Update(ctx context.Context, id string, input domain.UpdateNodeInput) (domain.Node, error) {
	var tagsJSON []byte
	if input.Tags != nil {
		tagsJSON, _ = json.Marshal(input.Tags)
	}
	var metaJSON []byte
	if len(input.Meta) > 0 {
		metaJSON = input.Meta
	}

	q := `UPDATE nodes SET
		title = COALESCE($2, title),
		content = COALESCE($3, content),
		meta = COALESCE($4, meta),
		status = COALESCE($5, status),
		visibility = COALESCE($6, visibility),
		tags = COALESCE($7, tags),
		updated_at = NOW()
		WHERE id = $1
		RETURNING id, project_id, author_id, type, title, content, meta, status, visibility, tags, display_id, canvas_x, canvas_y, created_at, updated_at`

	var node domain.Node
	var tagsRaw []byte
	err := r.db.QueryRow(ctx, q, id, input.Title, input.Content, metaJSON, input.Status, input.Visibility, tagsJSON).
		Scan(&node.ID, &node.ProjectID, &node.AuthorID, &node.Type, &node.Title, &node.Content, &node.Meta, &node.Status, &node.Visibility, &tagsRaw, &node.DisplayID, &node.CanvasX, &node.CanvasY, &node.CreatedAt, &node.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Node{}, domain.ErrNotFound
		}
		return domain.Node{}, err
	}
	_ = json.Unmarshal(tagsRaw, &node.Tags)
	return node, nil
}

func (r *pgxRepository) Delete(ctx context.Context, id string) error {
	res, err := r.db.Exec(ctx, `DELETE FROM nodes WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *pgxRepository) UpdateCanvas(ctx context.Context, id string, x, y float64) error {
	_, err := r.db.Exec(ctx, `UPDATE nodes SET canvas_x = $2, canvas_y = $3, updated_at = NOW() WHERE id = $1`, id, x, y)
	return err
}

func (r *pgxRepository) CreateRelation(ctx context.Context, fromID, toID string, relType domain.RelationType, note *string, authorID string) (domain.Relation, error) {
	q := `INSERT INTO node_relations (from_node_id, to_node_id, type, note, author_id)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, from_node_id, to_node_id, type, note, author_id, created_at`
	var rel domain.Relation
	err := r.db.QueryRow(ctx, q, fromID, toID, relType, note, authorID).
		Scan(&rel.ID, &rel.FromNodeID, &rel.ToNodeID, &rel.Type, &rel.Note, &rel.AuthorID, &rel.CreatedAt)
	return rel, err
}

func (r *pgxRepository) GetRelations(ctx context.Context, nodeID string) ([]domain.RelationWithNode, error) {
	q := `SELECT r.id, r.from_node_id, r.to_node_id, r.type, r.note, r.author_id, r.created_at,
	             n.id, n.type, n.title, n.display_id, n.status
		FROM node_relations r
		JOIN nodes n ON (CASE WHEN r.from_node_id = $1 THEN r.to_node_id ELSE r.from_node_id END = n.id)
		WHERE r.from_node_id = $1 OR r.to_node_id = $1`

	rows, err := r.db.Query(ctx, q, nodeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rels []domain.RelationWithNode
	for rows.Next() {
		var r domain.RelationWithNode
		if err := rows.Scan(&r.ID, &r.FromNodeID, &r.ToNodeID, &r.Type, &r.Note, &r.AuthorID, &r.CreatedAt,
			&r.Node.ID, &r.Node.Type, &r.Node.Title, &r.Node.DisplayID, &r.Node.Status); err != nil {
			return nil, err
		}
		rels = append(rels, r)
	}
	return rels, nil
}

func (r *pgxRepository) DeleteRelation(ctx context.Context, id, userID string) error {
	res, err := r.db.Exec(ctx, `DELETE FROM node_relations WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
