package comment

import (
	"context"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/internal/ws"
)

type mockCommentRepo struct {
	comments  []domain.Comment
	reactions map[string][]domain.Reaction
}

func (m *mockCommentRepo) Create(ctx context.Context, nodeID, authorID string, replyToID *string, content string) (domain.Comment, error) {
	c := domain.Comment{ID: "c1", NodeID: nodeID, AuthorID: &authorID, Content: content}
	m.comments = append(m.comments, c)
	return c, nil
}
func (m *mockCommentRepo) GetByNode(ctx context.Context, nodeID string, cursor string, limit int) ([]domain.Comment, string, bool, error) {
	return m.comments, "", false, nil
}
func (m *mockCommentRepo) GetByID(ctx context.Context, id string) (domain.Comment, error) {
	for _, c := range m.comments {
		if c.ID == id {
			return c, nil
		}
	}
	return domain.Comment{}, ErrNotFound
}
func (m *mockCommentRepo) Update(ctx context.Context, id, content string) (domain.Comment, error) {
	return domain.Comment{ID: id, Content: content}, nil
}
func (m *mockCommentRepo) Delete(ctx context.Context, id string) error {
	return nil
}
func (m *mockCommentRepo) GetReplies(ctx context.Context, commentID string) ([]domain.Comment, error) {
	return nil, nil
}
func (m *mockCommentRepo) UpsertReaction(ctx context.Context, commentID, userID, emoji string) (bool, error) {
	return true, nil
}
func (m *mockCommentRepo) GetReactions(ctx context.Context, commentID string) ([]domain.Reaction, error) {
	return nil, nil
}
func (m *mockCommentRepo) GetAuthor(ctx context.Context, commentID string) (string, error) {
	for _, c := range m.comments {
		if c.ID == commentID && c.AuthorID != nil {
			return *c.AuthorID, nil
		}
	}
	return "", ErrNotFound
}

type mockNodeRepoForComment struct {
	node domain.Node
	role domain.Role
}

func (m *mockNodeRepoForComment) Create(ctx context.Context, projectID, authorID string, input domain.CreateNodeInput) (domain.Node, error) {
	return domain.Node{}, nil
}
func (m *mockNodeRepoForComment) GetByID(ctx context.Context, id, userID string) (domain.Node, domain.Role, error) {
	return m.node, m.role, nil
}
func (m *mockNodeRepoForComment) List(ctx context.Context, params domain.ListNodesParams) ([]domain.Node, string, bool, error) {
	return nil, "", false, nil
}
func (m *mockNodeRepoForComment) Update(ctx context.Context, id string, input domain.UpdateNodeInput) (domain.Node, error) {
	return domain.Node{}, nil
}
func (m *mockNodeRepoForComment) Delete(ctx context.Context, id string) error {
	return nil
}
func (m *mockNodeRepoForComment) UpdateCanvas(ctx context.Context, id string, x, y float64) error {
	return nil
}
func (m *mockNodeRepoForComment) CreateRelation(ctx context.Context, fromID, toID string, relType domain.RelationType, note *string, authorID string) (domain.Relation, error) {
	return domain.Relation{}, nil
}
func (m *mockNodeRepoForComment) GetRelations(ctx context.Context, nodeID string) ([]domain.RelationWithNode, error) {
	return nil, nil
}
func (m *mockNodeRepoForComment) DeleteRelation(ctx context.Context, id, userID string) error {
	return nil
}
func (m *mockNodeRepoForComment) GetNextDisplayIDNum(ctx context.Context, projectID string, nodeType domain.NodeType) (int, error) {
	return 1, nil
}

func TestCommentService(t *testing.T) {
	hub := ws.NewHub()
	pID := "p1"

	t.Run("TestCreate_Success", func(t *testing.T) {
		repo := &mockCommentRepo{}
		nodeRepo := &mockNodeRepoForComment{
			node: domain.Node{ID: "n1", ProjectID: &pID, Visibility: domain.VisibilityShared},
			role: domain.RoleEditor,
		}
		svc := NewService(repo, nodeRepo, hub)

		c, err := svc.Create(context.Background(), "n1", "u1", nil, "hello")
		require.NoError(t, err)
		assert.Equal(t, "hello", c.Content)
	})

	t.Run("TestCreate_ContentTooLong", func(t *testing.T) {
		repo := &mockCommentRepo{}
		nodeRepo := &mockNodeRepoForComment{
			node: domain.Node{ID: "n1", ProjectID: &pID, Visibility: domain.VisibilityShared},
			role: domain.RoleEditor,
		}
		svc := NewService(repo, nodeRepo, hub)

		longContent := strings.Repeat("a", 10001)
		_, err := svc.Create(context.Background(), "n1", "u1", nil, longContent)
		assert.Equal(t, ErrContentTooLong, err)
	})

	t.Run("TestCreate_ViewerCanCommentOnSharedNode", func(t *testing.T) {
		repo := &mockCommentRepo{}
		nodeRepo := &mockNodeRepoForComment{
			node: domain.Node{ID: "n1", ProjectID: &pID, Visibility: domain.VisibilityShared},
			role: domain.RoleViewer,
		}
		svc := NewService(repo, nodeRepo, hub)

		_, err := svc.Create(context.Background(), "n1", "u1", nil, "hello")
		require.NoError(t, err)
	})

	t.Run("TestCreate_ViewerCannotCommentOnInternalNode", func(t *testing.T) {
		repo := &mockCommentRepo{}
		nodeRepo := &mockNodeRepoForComment{
			node: domain.Node{ID: "n1", ProjectID: &pID, Visibility: domain.VisibilityInternal},
			role: domain.RoleViewer,
		}
		svc := NewService(repo, nodeRepo, hub)

		_, err := svc.Create(context.Background(), "n1", "u1", nil, "hello")
		assert.Equal(t, domain.ErrForbidden, err)
	})

	t.Run("TestUpdate_OnlyAuthor", func(t *testing.T) {
		u1 := "u1"
		repo := &mockCommentRepo{comments: []domain.Comment{{ID: "c1", AuthorID: &u1}}}
		nodeRepo := &mockNodeRepoForComment{}
		svc := NewService(repo, nodeRepo, hub)

		_, err := svc.Update(context.Background(), "c1", "u2", "updated")
		assert.Equal(t, domain.ErrForbidden, err)
	})

	t.Run("TestDelete_AuthorCanDelete", func(t *testing.T) {
		u1 := "u1"
		repo := &mockCommentRepo{comments: []domain.Comment{{ID: "c1", AuthorID: &u1}}}
		nodeRepo := &mockNodeRepoForComment{}
		svc := NewService(repo, nodeRepo, hub)

		err := svc.Delete(context.Background(), "c1", "u1")
		require.NoError(t, err)
	})

	t.Run("TestToggleReaction_Add", func(t *testing.T) {
		repo := &mockCommentRepo{}
		svc := NewService(repo, nil, hub)
		added, err := svc.ToggleReaction(context.Background(), "c1", "u1", "👍")
		require.NoError(t, err)
		assert.True(t, added)
	})

	t.Run("TestToggleReaction_InvalidEmoji", func(t *testing.T) {
		repo := &mockCommentRepo{}
		svc := NewService(repo, nil, hub)
		_, err := svc.ToggleReaction(context.Background(), "c1", "u1", "🍕")
		assert.Equal(t, ErrInvalidEmoji, err)
	})
}
