package project

import (
	"context"
	"encoding/json"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/synapse/api/internal/domain"
)

type Repository interface {
	Create(ctx context.Context, input domain.CreateProjectInput, ownerID string) (domain.Project, error)
	GetByID(ctx context.Context, id, userID string) (domain.Project, domain.Role, error)
	List(ctx context.Context, userID, cursor string, limit int) ([]domain.Project, string, bool, error)
	Update(ctx context.Context, id string, input domain.UpdateProjectInput) (domain.Project, error)
	Archive(ctx context.Context, id string) error
	GetMembers(ctx context.Context, projectID string) ([]domain.ProjectMember, error)
	AddMember(ctx context.Context, projectID, userID string, role domain.Role, invitedBy string) (domain.ProjectMember, error)
	UpdateMemberRole(ctx context.Context, projectID, userID string, role domain.Role) (domain.ProjectMember, error)
	RemoveMember(ctx context.Context, projectID, userID string) error
	GetUserRole(ctx context.Context, projectID, userID string) (domain.Role, error)
	GetNodeCounts(ctx context.Context, projectID string) (map[string]int64, error)
}

type pgxRepository struct {
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) Repository {
	return &pgxRepository{pool: pool}
}

func (r *pgxRepository) Create(ctx context.Context, input domain.CreateProjectInput, ownerID string) (domain.Project, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return domain.Project{}, err
	}
	defer tx.Rollback(ctx)

	// Get user's workspace
	var workspaceID string
	err = tx.QueryRow(ctx, `SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1`, ownerID).Scan(&workspaceID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			// Create a default workspace if not found
			err = tx.QueryRow(ctx, `
				INSERT INTO workspaces (name, owner_id)
				VALUES ($1, $2)
				RETURNING id
			`, "Personal Workspace", ownerID).Scan(&workspaceID)
			if err != nil {
				return domain.Project{}, err
			}
			_, err = tx.Exec(ctx, `
				INSERT INTO workspace_members (workspace_id, user_id, role)
				VALUES ($1, $2, 'owner')
			`, workspaceID, ownerID)
			if err != nil {
				return domain.Project{}, err
			}
		} else {
			return domain.Project{}, err
		}
	}

	tagsJSON, err := json.Marshal(input.Tags)
	if err != nil {
		tagsJSON = []byte("[]")
	}

	var p domain.Project
	var tagsRaw []byte
	err = tx.QueryRow(ctx, `
		INSERT INTO projects (workspace_id, name, status, type, description, tags)
		VALUES ($1, $2, 'active', $3, $4, $5)
		RETURNING id, workspace_id, name, status, type, description, tags, created_at, updated_at
	`, workspaceID, input.Name, input.Type, input.Description, tagsJSON).
		Scan(&p.ID, &p.WorkspaceID, &p.Name, &p.Status, &p.Type, &p.Description, &tagsRaw, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return domain.Project{}, err
	}
	_ = json.Unmarshal(tagsRaw, &p.Tags)

	_, err = tx.Exec(ctx, `
		INSERT INTO project_members (project_id, user_id, role, invited_by)
		VALUES ($1, $2, $3, $2)
	`, p.ID, ownerID, domain.RoleOwner)
	if err != nil {
		return domain.Project{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.Project{}, err
	}
	p.Role = domain.RoleOwner
	return p, nil
}

func (r *pgxRepository) GetByID(ctx context.Context, id, userID string) (domain.Project, domain.Role, error) {
	var p domain.Project
	var role domain.Role
	var tagsRaw []byte
	err := r.pool.QueryRow(ctx, `
		SELECT p.id, p.workspace_id, p.name, p.status, p.type, p.description, p.tags, p.created_at, p.updated_at, m.role
		FROM projects p
		JOIN project_members m ON p.id = m.project_id
		WHERE p.id = $1 AND m.user_id = $2 AND p.status != 'archived'
	`, id, userID).Scan(&p.ID, &p.WorkspaceID, &p.Name, &p.Status, &p.Type, &p.Description, &tagsRaw, &p.CreatedAt, &p.UpdatedAt, &role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Project{}, "", domain.ErrNotFound
		}
		return domain.Project{}, "", err
	}
	_ = json.Unmarshal(tagsRaw, &p.Tags)
	p.Role = role
	return p, role, nil
}

func (r *pgxRepository) List(ctx context.Context, userID, cursor string, limit int) ([]domain.Project, string, bool, error) {
	query := `
		SELECT p.id, p.workspace_id, p.name, p.status, p.type, p.description, p.tags, p.created_at, p.updated_at, m.role
		FROM projects p
		JOIN project_members m ON p.id = m.project_id
		WHERE m.user_id = $1 AND p.status != 'archived'
	`
	args := []interface{}{userID}
	if cursor != "" {
		query += ` AND p.id > $2`
		args = append(args, cursor)
	}
	query += ` ORDER BY p.id ASC LIMIT $`
	if cursor != "" {
		query += `3`
	} else {
		query += `2`
	}
	args = append(args, limit+1)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, "", false, err
	}
	defer rows.Close()

	var projects []domain.Project
	for rows.Next() {
		var p domain.Project
		var tagsRaw []byte
		if err := rows.Scan(&p.ID, &p.WorkspaceID, &p.Name, &p.Status, &p.Type, &p.Description, &tagsRaw, &p.CreatedAt, &p.UpdatedAt, &p.Role); err != nil {
			return nil, "", false, err
		}
		_ = json.Unmarshal(tagsRaw, &p.Tags)
		projects = append(projects, p)
	}

	hasMore := false
	nextCursor := ""
	if len(projects) > limit {
		hasMore = true
		projects = projects[:limit]
	}
	if len(projects) > 0 {
		nextCursor = projects[len(projects)-1].ID
	}

	return projects, nextCursor, hasMore, nil
}

func (r *pgxRepository) Update(ctx context.Context, id string, input domain.UpdateProjectInput) (domain.Project, error) {
	var p domain.Project
	var tagsRaw []byte

	var tagsJSON []byte
	if input.Tags != nil {
		tagsJSON, _ = json.Marshal(input.Tags)
	}

	err := r.pool.QueryRow(ctx, `
		UPDATE projects
		SET name = COALESCE($1, name),
		    description = COALESCE($2, description),
		    type = COALESCE($3, type),
		    status = COALESCE($4, status),
		    tags = COALESCE($5, tags),
		    updated_at = NOW()
		WHERE id = $6 AND status != 'archived'
		RETURNING id, workspace_id, name, status, type, description, tags, created_at, updated_at
	`, input.Name, input.Description, input.Type, input.Status, tagsJSON, id).
		Scan(&p.ID, &p.WorkspaceID, &p.Name, &p.Status, &p.Type, &p.Description, &tagsRaw, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.Project{}, domain.ErrNotFound
		}
		return domain.Project{}, err
	}
	_ = json.Unmarshal(tagsRaw, &p.Tags)
	return p, nil
}

func (r *pgxRepository) Archive(ctx context.Context, id string) error {
	res, err := r.pool.Exec(ctx, `UPDATE projects SET status = 'archived' WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *pgxRepository) GetMembers(ctx context.Context, projectID string) ([]domain.ProjectMember, error) {
	rows, err := r.pool.Query(ctx, `
		SELECT pm.project_id, pm.user_id, u.name, u.email, COALESCE(u.avatar_url, ''), pm.role, pm.invited_by, pm.invited_at
		FROM project_members pm
		JOIN users u ON u.id = pm.user_id
		WHERE pm.project_id = $1
	`, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []domain.ProjectMember
	for rows.Next() {
		var m domain.ProjectMember
		if err := rows.Scan(&m.ProjectID, &m.UserID, &m.UserName, &m.UserEmail, &m.UserAvatar, &m.Role, &m.InvitedBy, &m.InvitedAt); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, nil
}

func (r *pgxRepository) AddMember(ctx context.Context, projectID, userID string, role domain.Role, invitedBy string) (domain.ProjectMember, error) {
	var m domain.ProjectMember
	err := r.pool.QueryRow(ctx, `
		INSERT INTO project_members (project_id, user_id, role, invited_by)
		VALUES ($1, $2, $3, $4)
		RETURNING project_id, user_id, role, invited_by, invited_at
	`, projectID, userID, role, invitedBy).Scan(&m.ProjectID, &m.UserID, &m.Role, &m.InvitedBy, &m.InvitedAt)
	if err != nil {
		return domain.ProjectMember{}, err
	}
	return m, nil
}

func (r *pgxRepository) UpdateMemberRole(ctx context.Context, projectID, userID string, role domain.Role) (domain.ProjectMember, error) {
	var m domain.ProjectMember
	err := r.pool.QueryRow(ctx, `
		UPDATE project_members SET role = $1
		WHERE project_id = $2 AND user_id = $3
		RETURNING project_id, user_id, role, invited_by, invited_at
	`, role, projectID, userID).Scan(&m.ProjectID, &m.UserID, &m.Role, &m.InvitedBy, &m.InvitedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.ProjectMember{}, domain.ErrNotFound
		}
		return domain.ProjectMember{}, err
	}
	return m, nil
}

func (r *pgxRepository) RemoveMember(ctx context.Context, projectID, userID string) error {
	res, err := r.pool.Exec(ctx, `DELETE FROM project_members WHERE project_id = $1 AND user_id = $2`, projectID, userID)
	if err != nil {
		return err
	}
	if res.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *pgxRepository) GetUserRole(ctx context.Context, projectID, userID string) (domain.Role, error) {
	var role domain.Role
	err := r.pool.QueryRow(ctx, `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`, projectID, userID).Scan(&role)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", domain.ErrNotFound
		}
		return "", err
	}
	return role, nil
}

func (r *pgxRepository) GetNodeCounts(ctx context.Context, projectID string) (map[string]int64, error) {
	rows, err := r.pool.Query(ctx, `SELECT type, COUNT(*) FROM nodes WHERE project_id = $1 GROUP BY type`, projectID)
	if err != nil {
		return map[string]int64{}, nil
	}
	defer rows.Close()

	counts := make(map[string]int64)
	for rows.Next() {
		var t string
		var c int64
		if err := rows.Scan(&t, &c); err == nil {
			counts[t] = c
		}
	}
	return counts, nil
}
