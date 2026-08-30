package node

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/internal/ws"
)

type mockNodeRepo struct {
	nodes     map[string]domain.Node
	roles     map[string]domain.Role // nodeID -> role
	relations []domain.RelationWithNode
}

func newMockNodeRepo() *mockNodeRepo {
	return &mockNodeRepo{
		nodes: make(map[string]domain.Node),
		roles: make(map[string]domain.Role),
	}
}

func (m *mockNodeRepo) Create(ctx context.Context, projectID, authorID string, input domain.CreateNodeInput) (domain.Node, error) {
	node := domain.Node{
		ID:         "n1",
		ProjectID:  &projectID,
		AuthorID:   &authorID,
		Type:       input.Type,
		Title:      input.Title,
		Content:    input.Content,
		Visibility: input.Visibility,
		DisplayID:  "F-001",
	}
	m.nodes[node.ID] = node
	m.roles[node.ID] = domain.RoleOwner
	return node, nil
}

func (m *mockNodeRepo) GetByID(ctx context.Context, id, userID string) (domain.Node, domain.Role, error) {
	n, ok := m.nodes[id]
	if !ok {
		return domain.Node{}, "", domain.ErrNotFound
	}
	role := m.roles[id]
	return n, role, nil
}

func (m *mockNodeRepo) List(ctx context.Context, params domain.ListNodesParams) ([]domain.Node, string, bool, error) {
	var result []domain.Node
	for _, n := range m.nodes {
		result = append(result, n)
	}
	return result, "", false, nil
}

func (m *mockNodeRepo) Update(ctx context.Context, id string, input domain.UpdateNodeInput) (domain.Node, error) {
	n, ok := m.nodes[id]
	if !ok {
		return domain.Node{}, domain.ErrNotFound
	}
	if input.Title != nil {
		n.Title = *input.Title
	}
	m.nodes[id] = n
	return n, nil
}

func (m *mockNodeRepo) Delete(ctx context.Context, id string) error {
	delete(m.nodes, id)
	return nil
}

func (m *mockNodeRepo) UpdateCanvas(ctx context.Context, id string, x, y float64) error {
	n, ok := m.nodes[id]
	if !ok {
		return domain.ErrNotFound
	}
	n.CanvasX = x
	n.CanvasY = y
	m.nodes[id] = n
	return nil
}

func (m *mockNodeRepo) CreateRelation(ctx context.Context, fromID, toID string, relType domain.RelationType, note *string, authorID string) (domain.Relation, error) {
	rel := domain.Relation{
		ID:         "r1",
		FromNodeID: fromID,
		ToNodeID:   toID,
		Type:       relType,
		Note:       note,
		AuthorID:   &authorID,
	}
	return rel, nil
}

func (m *mockNodeRepo) GetRelations(ctx context.Context, nodeID string) ([]domain.RelationWithNode, error) {
	return m.relations, nil
}

func (m *mockNodeRepo) DeleteRelation(ctx context.Context, id, userID string) error {
	return nil
}

func (m *mockNodeRepo) GetNextDisplayIDNum(ctx context.Context, projectID string, nodeType domain.NodeType) (int, error) {
	return 1, nil
}

func TestNodeService_Create_Success(t *testing.T) {
	repo := newMockNodeRepo()
	hub := ws.NewHub()
	lockStore := ws.NewLockStore()
	svc := NewService(repo, hub, lockStore)

	input := domain.CreateNodeInput{
		Type:       domain.NodeTypeFeature,
		Title:      "Fast Search System",
		Visibility: domain.VisibilityInternal,
	}

	node, err := svc.Create(context.Background(), "p1", "u1", input)
	require.NoError(t, err)
	assert.Equal(t, "n1", node.ID)
	assert.Equal(t, "Fast Search System", node.Title)
	assert.Equal(t, "F-001", node.DisplayID)
}

func TestNodeService_Create_EmptyTitle(t *testing.T) {
	repo := newMockNodeRepo()
	svc := NewService(repo, ws.NewHub(), ws.NewLockStore())

	input := domain.CreateNodeInput{
		Type:  domain.NodeTypeFeature,
		Title: "",
	}

	_, err := svc.Create(context.Background(), "p1", "u1", input)
	assert.Error(t, err)
	assert.Equal(t, domain.ErrBadRequest, err)
}

func TestNodeService_GetByID_InternalNodeHiddenFromViewer(t *testing.T) {
	repo := newMockNodeRepo()
	svc := NewService(repo, ws.NewHub(), ws.NewLockStore())

	pID := "p1"
	repo.nodes["n1"] = domain.Node{
		ID:         "n1",
		ProjectID:  &pID,
		Title:      "Secret",
		Visibility: domain.VisibilityInternal,
	}
	repo.roles["n1"] = domain.RoleViewer

	_, err := svc.GetByID(context.Background(), "n1", "viewer-user")
	assert.Error(t, err)
	assert.Equal(t, domain.ErrNotFound, err)
}

func TestNodeService_GetByID_SharedNodeVisibleToViewer(t *testing.T) {
	repo := newMockNodeRepo()
	svc := NewService(repo, ws.NewHub(), ws.NewLockStore())

	pID := "p1"
	repo.nodes["n1"] = domain.Node{
		ID:         "n1",
		ProjectID:  &pID,
		Title:      "Public Roadmap",
		Visibility: domain.VisibilityShared,
	}
	repo.roles["n1"] = domain.RoleViewer

	node, err := svc.GetByID(context.Background(), "n1", "viewer-user")
	require.NoError(t, err)
	assert.Equal(t, "Public Roadmap", node.Title)
}

func TestNodeService_Delete_Permissions(t *testing.T) {
	repo := newMockNodeRepo()
	svc := NewService(repo, ws.NewHub(), ws.NewLockStore())

	pID := "p1"
	repo.nodes["n1"] = domain.Node{ID: "n1", ProjectID: &pID, Title: "Feature"}
	repo.roles["n1"] = domain.RoleViewer

	err := svc.Delete(context.Background(), "n1", "viewer-user")
	assert.Error(t, err)
	assert.Equal(t, domain.ErrForbidden, err)

	repo.roles["n1"] = domain.RoleOwner
	err = svc.Delete(context.Background(), "n1", "owner-user")
	require.NoError(t, err)
}
