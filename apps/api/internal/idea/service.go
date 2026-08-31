package idea

import (
	"context"
	"strings"

	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/internal/node"
	"github.com/synapse/api/internal/ws"
)

type Service struct {
	repo     Repository
	nodeRepo node.Repository
	hub      *ws.Hub
}

func NewService(repo Repository, nodeRepo node.Repository, hub *ws.Hub) *Service {
	return &Service{
		repo:     repo,
		nodeRepo: nodeRepo,
		hub:      hub,
	}
}

// Group methods
func (s *Service) CreateGroup(ctx context.Context, userID string, input domain.CreateIdeaGroupInput) (domain.IdeaGroup, error) {
	if strings.TrimSpace(input.Name) == "" {
		return domain.IdeaGroup{}, domain.ErrBadRequest
	}
	return s.repo.CreateGroup(ctx, userID, input)
}

func (s *Service) ListGroups(ctx context.Context, userID string) ([]domain.IdeaGroup, error) {
	return s.repo.ListGroups(ctx, userID)
}

func (s *Service) DeleteGroup(ctx context.Context, id, userID string) error {
	return s.repo.DeleteGroup(ctx, id, userID)
}

// Idea methods
func (s *Service) CreateIdea(ctx context.Context, userID string, input domain.CreateIdeaInput) (domain.Idea, error) {
	if strings.TrimSpace(input.Title) == "" {
		return domain.Idea{}, domain.ErrBadRequest
	}

	item, err := s.repo.CreateIdea(ctx, userID, input)
	if err != nil {
		return domain.Idea{}, err
	}

	if s.hub != nil {
		s.hub.BroadcastToUser(userID, ws.Event{
			Type: ws.EventIdeaCreated,
			Data: item,
		})
	}

	return item, nil
}

func (s *Service) ListIdeas(ctx context.Context, userID string, groupID *string) ([]domain.Idea, error) {
	return s.repo.ListIdeas(ctx, userID, groupID)
}

func (s *Service) GetIdeaByID(ctx context.Context, id, userID string) (domain.Idea, error) {
	return s.repo.GetIdeaByID(ctx, id, userID)
}

func (s *Service) UpdateIdea(ctx context.Context, id, userID string, input domain.UpdateIdeaInput) (domain.Idea, error) {
	item, err := s.repo.UpdateIdea(ctx, id, userID, input)
	if err != nil {
		return domain.Idea{}, err
	}

	if s.hub != nil {
		s.hub.BroadcastToUser(userID, ws.Event{
			Type: ws.EventIdeaUpdated,
			Data: item,
		})
	}

	return item, nil
}

func (s *Service) DeleteIdea(ctx context.Context, id, userID string) error {
	err := s.repo.DeleteIdea(ctx, id, userID)
	if err != nil {
		return err
	}

	if s.hub != nil {
		s.hub.BroadcastToUser(userID, ws.Event{
			Type: ws.EventIdeaDeleted,
			Data: map[string]string{"id": id},
		})
	}

	return nil
}

func (s *Service) PromoteIdea(ctx context.Context, id, userID string, input domain.PromoteIdeaInput) (domain.Node, error) {
	idea, err := s.repo.GetIdeaByID(ctx, id, userID)
	if err != nil {
		return domain.Node{}, err
	}

	createNodeInput := domain.CreateNodeInput{
		Type:       input.Type,
		Title:      idea.Title,
		Content:    idea.Content,
		Tags:       idea.Tags,
		Visibility: domain.VisibilityShared,
	}

	createdNode, err := s.nodeRepo.Create(ctx, input.ProjectID, userID, createNodeInput)
	if err != nil {
		return domain.Node{}, err
	}

	_ = s.repo.SetPromotedNodeID(ctx, id, userID, createdNode.ID)

	if s.hub != nil {
		s.hub.BroadcastToProject(input.ProjectID, ws.Event{
			Type: ws.EventNodeCreated,
			Data: createdNode,
		}, "")
		s.hub.BroadcastToUser(userID, ws.Event{
			Type: ws.EventIdeaUpdated,
			Data: map[string]string{"id": id, "promoted_node_id": createdNode.ID, "status": "matured"},
		})
	}

	return createdNode, nil
}