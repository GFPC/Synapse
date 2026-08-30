package project

import (
	"context"
	"testing"

	"github.com/synapse/api/internal/domain"
)

type mockProjectRepo struct {
	projects map[string]domain.Project
	roles    map[string]map[string]domain.Role // projectID -> userID -> role
}

func newMockProjectRepo() *mockProjectRepo {
	return &mockProjectRepo{
		projects: make(map[string]domain.Project),
		roles:    make(map[string]map[string]domain.Role),
	}
}

func (m *mockProjectRepo) Create(ctx context.Context, input domain.CreateProjectInput, ownerID string) (domain.Project, error) {
	p := domain.Project{ID: "p1", Name: input.Name, Description: input.Description}
	m.projects[p.ID] = p
	m.roles[p.ID] = map[string]domain.Role{ownerID: domain.RoleOwner}
	return p, nil
}

func (m *mockProjectRepo) GetByID(ctx context.Context, id, userID string) (domain.Project, domain.Role, error) {
	p, ok := m.projects[id]
	if !ok {
		return domain.Project{}, "", domain.ErrNotFound
	}
	role, ok := m.roles[id][userID]
	if !ok {
		return domain.Project{}, "", domain.ErrNotFound
	}
	return p, role, nil
}

func (m *mockProjectRepo) List(ctx context.Context, userID, cursor string, limit int) ([]domain.Project, string, bool, error) {
	return nil, "", false, nil
}

func (m *mockProjectRepo) Update(ctx context.Context, id string, input domain.UpdateProjectInput) (domain.Project, error) {
	return domain.Project{}, nil
}

func (m *mockProjectRepo) Archive(ctx context.Context, id string) error {
	delete(m.projects, id)
	return nil
}

func (m *mockProjectRepo) GetMembers(ctx context.Context, projectID string) ([]domain.ProjectMember, error) {
	return nil, nil
}

func (m *mockProjectRepo) AddMember(ctx context.Context, projectID, userID string, role domain.Role, invitedBy string) (domain.ProjectMember, error) {
	if m.roles[projectID] == nil {
		m.roles[projectID] = make(map[string]domain.Role)
	}
	m.roles[projectID][userID] = role
	return domain.ProjectMember{UserID: userID, ProjectID: projectID, Role: role}, nil
}

func (m *mockProjectRepo) UpdateMemberRole(ctx context.Context, projectID, userID string, role domain.Role) (domain.ProjectMember, error) {
	return domain.ProjectMember{}, nil
}

func (m *mockProjectRepo) RemoveMember(ctx context.Context, projectID, userID string) error {
	return nil
}

func (m *mockProjectRepo) GetUserRole(ctx context.Context, projectID, userID string) (domain.Role, error) {
	role, ok := m.roles[projectID][userID]
	if !ok {
		return "", domain.ErrNotFound
	}
	return role, nil
}

func (m *mockProjectRepo) GetNodeCounts(ctx context.Context, projectID string) (map[string]int64, error) {
	return nil, nil
}

type mockUserResolver struct {
	users map[string]domain.User
}

func (m *mockUserResolver) GetUserByEmail(ctx context.Context, email string) (domain.User, error) {
	u, ok := m.users[email]
	if !ok {
		return domain.User{}, domain.ErrNotFound
	}
	return u, nil
}

func TestProjectService_Create_Success(t *testing.T) {
	repo := newMockProjectRepo()
	svc := NewProjectService(repo, &mockUserResolver{})

	p, err := svc.Create(context.Background(), domain.CreateProjectInput{Name: "Test"}, "u1")
	if err != nil {
		t.Errorf("expected no error, got %v", err)
	}
	if p.Name != "Test" {
		t.Errorf("expected name Test, got %s", p.Name)
	}
}

func TestProjectService_GetByID_NotFound(t *testing.T) {
	repo := newMockProjectRepo()
	svc := NewProjectService(repo, &mockUserResolver{})

	_, err := svc.GetByID(context.Background(), "p1", "u1")
	if err != domain.ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestProjectService_GetByID_AccessDenied(t *testing.T) {
	repo := newMockProjectRepo()
	svc := NewProjectService(repo, &mockUserResolver{})
	
	// Create project for u1
	svc.Create(context.Background(), domain.CreateProjectInput{Name: "Test"}, "u1")

	// Try access as u2
	_, err := svc.GetByID(context.Background(), "p1", "u2")
	if err != domain.ErrNotFound {
		t.Errorf("expected ErrNotFound for denied access, got %v", err)
	}
}

func TestProjectService_InviteMember_UserNotFound(t *testing.T) {
	repo := newMockProjectRepo()
	ur := &mockUserResolver{users: make(map[string]domain.User)}
	svc := NewProjectService(repo, ur)
	svc.Create(context.Background(), domain.CreateProjectInput{Name: "Test"}, "u1")

	_, err := svc.InviteMember(context.Background(), "p1", "u1", "notfound@example.com", domain.RoleViewer)
	if err != domain.ErrNotFound {
		t.Errorf("expected ErrNotFound, got %v", err)
	}
}

func TestProjectService_Archive_OnlyOwner(t *testing.T) {
	repo := newMockProjectRepo()
	svc := NewProjectService(repo, &mockUserResolver{})
	svc.Create(context.Background(), domain.CreateProjectInput{Name: "Test"}, "u1")

	// Add editor
	repo.roles["p1"]["u2"] = domain.RoleEditor

	err := svc.Archive(context.Background(), "p1", "u2")
	if err != domain.ErrForbidden {
		t.Errorf("expected ErrForbidden for editor, got %v", err)
	}

	err = svc.Archive(context.Background(), "p1", "u1")
	if err != nil {
		t.Errorf("expected success for owner, got %v", err)
	}
}
