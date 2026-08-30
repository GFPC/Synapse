package comment

import (
	"context"
	"errors"

	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/internal/node"
	"github.com/synapse/api/internal/ws"
)

var (
	ErrContentTooLong = errors.New("content exceeds 10000 characters")
	ErrContentEmpty   = errors.New("content cannot be empty")
	ErrNotFound       = errors.New("not found")
	ErrUnauthorized   = errors.New("unauthorized")
	ErrInvalidEmoji   = errors.New("invalid emoji")
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

func (s *Service) Create(ctx context.Context, nodeID, authorID string, replyToID *string, content string) (domain.Comment, error) {
	if len(content) == 0 {
		return domain.Comment{}, ErrContentEmpty
	}
	if len(content) > 10000 {
		return domain.Comment{}, ErrContentTooLong
	}

	if replyToID != nil {
		_, err := s.repo.GetByID(ctx, *replyToID)
		if err != nil {
			return domain.Comment{}, err
		}
	}

	n, role, err := s.nodeRepo.GetByID(ctx, nodeID, authorID)
	if err != nil {
		return domain.Comment{}, err
	}

	if n.Visibility == domain.VisibilityInternal && role == domain.RoleViewer {
		return domain.Comment{}, domain.ErrForbidden
	}

	comment, err := s.repo.Create(ctx, nodeID, authorID, replyToID, content)
	if err != nil {
		return domain.Comment{}, err
	}

	if n.ProjectID != nil && s.hub != nil {
		s.hub.BroadcastToProject(*n.ProjectID, ws.Event{
			Type: ws.EventCommentAdded,
			Data: comment,
		}, authorID)
	}

	return comment, nil
}

func (s *Service) GetByNode(ctx context.Context, nodeID, userID, cursor string, limit int) ([]domain.Comment, string, bool, error) {
	n, role, err := s.nodeRepo.GetByID(ctx, nodeID, userID)
	if err != nil {
		return nil, "", false, err
	}

	if n.Visibility == domain.VisibilityInternal && role == domain.RoleViewer {
		return nil, "", false, domain.ErrNotFound
	}

	comments, nextCursor, hasMore, err := s.repo.GetByNode(ctx, nodeID, cursor, limit)
	if err != nil {
		return nil, "", false, err
	}

	for i := range comments {
		replies, err := s.repo.GetReplies(ctx, comments[i].ID)
		if err == nil {
			comments[i].Replies = replies
		}
	}

	return comments, nextCursor, hasMore, nil
}

func (s *Service) Update(ctx context.Context, id, userID, content string) (domain.Comment, error) {
	if len(content) == 0 || len(content) > 10000 {
		return domain.Comment{}, ErrContentTooLong
	}

	authorID, err := s.repo.GetAuthor(ctx, id)
	if err != nil {
		return domain.Comment{}, err
	}
	if authorID != userID {
		return domain.Comment{}, domain.ErrForbidden
	}

	return s.repo.Update(ctx, id, content)
}

func (s *Service) Delete(ctx context.Context, id, userID string) error {
	comment, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if comment.AuthorID == nil || *comment.AuthorID != userID {
		_, role, err := s.nodeRepo.GetByID(ctx, comment.NodeID, userID)
		if err != nil {
			return err
		}
		if role != domain.RoleOwner {
			return domain.ErrForbidden
		}
	}

	return s.repo.Delete(ctx, id)
}

func (s *Service) ToggleReaction(ctx context.Context, commentID, userID, emoji string) (bool, error) {
	valid := map[string]bool{"👍": true, "✅": true, "❓": true, "❤️": true}
	if !valid[emoji] {
		return false, ErrInvalidEmoji
	}
	return s.repo.UpsertReaction(ctx, commentID, userID, emoji)
}
