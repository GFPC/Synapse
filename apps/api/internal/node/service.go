package node

import (
	"context"

	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/internal/ws"
)

type NodeService struct {
	repo      Repository
	hub       *ws.Hub
	lockStore *ws.LockStore
}

func NewService(repo Repository, hub *ws.Hub, lockStore *ws.LockStore) *NodeService {
	return &NodeService{
		repo:      repo,
		hub:       hub,
		lockStore: lockStore,
	}
}

func (s *NodeService) Create(ctx context.Context, projectID, userID string, input domain.CreateNodeInput) (domain.Node, error) {
	if len(input.Title) < 1 || len(input.Title) > 500 {
		return domain.Node{}, domain.ErrBadRequest
	}
	if input.Visibility == "" {
		input.Visibility = domain.VisibilityShared
	}
	if input.Status == "" {
		input.Status = "in_progress"
	}

	node, err := s.repo.Create(ctx, projectID, userID, input)
	if err != nil {
		return domain.Node{}, err
	}

	if s.hub != nil {
		s.hub.BroadcastToProject(projectID, ws.Event{
			Type: ws.EventNodeCreated,
			Data: node,
		}, userID)
	}

	return node, nil
}

func (s *NodeService) GetByID(ctx context.Context, id, userID string) (domain.Node, error) {
	node, role, err := s.repo.GetByID(ctx, id, userID)
	if err != nil {
		return domain.Node{}, err
	}

	if role == domain.RoleViewer && node.Visibility != domain.VisibilityShared {
		return domain.Node{}, domain.ErrNotFound
	}

	return node, nil
}

func (s *NodeService) List(ctx context.Context, params domain.ListNodesParams) ([]domain.Node, string, bool, error) {
	return s.repo.List(ctx, params)
}

func (s *NodeService) Update(ctx context.Context, id, userID string, input domain.UpdateNodeInput) (domain.Node, error) {
	node, err := s.repo.Update(ctx, id, input)
	if err != nil {
		return domain.Node{}, err
	}

	if node.ProjectID != nil && s.hub != nil {
		s.hub.BroadcastToProject(*node.ProjectID, ws.Event{
			Type: ws.EventNodeUpdated,
			Data: node,
		}, userID)
	}

	return node, nil
}

func (s *NodeService) Delete(ctx context.Context, id, userID string) error {
	node, role, err := s.repo.GetByID(ctx, id, userID)
	if err != nil {
		return err
	}
	if role != domain.RoleOwner && role != domain.RoleEditor {
		return domain.ErrForbidden
	}

	err = s.repo.Delete(ctx, id)
	if err != nil {
		return err
	}

	if node.ProjectID != nil && s.hub != nil {
		s.hub.BroadcastToProject(*node.ProjectID, ws.Event{
			Type: ws.EventNodeDeleted,
			Data: map[string]string{"id": id},
		}, userID)
	}

	return nil
}

func (s *NodeService) UpdateCanvas(ctx context.Context, id, userID string, x, y float64) error {
	return s.repo.UpdateCanvas(ctx, id, x, y)
}

func (s *NodeService) CreateRelation(ctx context.Context, fromID, toID string, relType domain.RelationType, note *string, userID string) (domain.Relation, error) {
	rel, err := s.repo.CreateRelation(ctx, fromID, toID, relType, note, userID)
	if err != nil {
		return domain.Relation{}, err
	}

	node, _, err := s.repo.GetByID(ctx, fromID, userID)
	if err == nil && node.ProjectID != nil && s.hub != nil {
		s.hub.BroadcastToProject(*node.ProjectID, ws.Event{
			Type: ws.EventRelationCreated,
			Data: rel,
		}, userID)
	}

	return rel, nil
}

func (s *NodeService) GetRelations(ctx context.Context, nodeID, userID string) ([]domain.RelationWithNode, error) {
	return s.repo.GetRelations(ctx, nodeID)
}

func (s *NodeService) DeleteRelation(ctx context.Context, id, userID string) error {
	return s.repo.DeleteRelation(ctx, id, userID)
}

func (s *NodeService) LockNode(ctx context.Context, id, userID, userName string) error {
	if s.lockStore != nil {
		if !s.lockStore.Acquire(id, userID, userName) {
			return domain.ErrConflict
		}
	}
	return nil
}

func (s *NodeService) UnlockNode(ctx context.Context, id, userID string) error {
	if s.lockStore != nil {
		s.lockStore.Release(id, userID)
	}
	return nil
}
