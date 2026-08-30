package project

import (
	"context"

	"github.com/synapse/api/internal/domain"
)

type UserResolver interface {
	GetUserByEmail(ctx context.Context, email string) (domain.User, error)
}

type ProjectService struct {
	repo         Repository
	userResolver UserResolver
}

func NewService(repo Repository) *ProjectService {
	return &ProjectService{
		repo: repo,
	}
}

func NewProjectService(repo Repository, userResolver UserResolver) *ProjectService {
	return &ProjectService{
		repo:         repo,
		userResolver: userResolver,
	}
}

func (s *ProjectService) Create(ctx context.Context, input domain.CreateProjectInput, ownerID string) (domain.Project, error) {
	return s.repo.Create(ctx, input, ownerID)
}

func (s *ProjectService) GetByID(ctx context.Context, id, userID string) (domain.Project, error) {
	p, _, err := s.repo.GetByID(ctx, id, userID)
	if err != nil {
		return domain.Project{}, err
	}

	members, err := s.repo.GetMembers(ctx, id)
	if err == nil {
		p.Members = members
	}

	counts, err := s.repo.GetNodeCounts(ctx, id)
	if err == nil {
		p.NodeCounts = counts
	}

	return p, nil
}

func (s *ProjectService) List(ctx context.Context, userID, cursor string, limit int) ([]domain.Project, string, bool, error) {
	return s.repo.List(ctx, userID, cursor, limit)
}

func (s *ProjectService) Update(ctx context.Context, id, userID string, input domain.UpdateProjectInput) (domain.Project, error) {
	role, err := s.repo.GetUserRole(ctx, id, userID)
	if err != nil {
		return domain.Project{}, err
	}
	if role != domain.RoleOwner && role != domain.RoleEditor {
		return domain.Project{}, domain.ErrForbidden
	}

	return s.repo.Update(ctx, id, input)
}

func (s *ProjectService) Archive(ctx context.Context, id, userID string) error {
	role, err := s.repo.GetUserRole(ctx, id, userID)
	if err != nil {
		return err
	}
	if role != domain.RoleOwner {
		return domain.ErrForbidden
	}

	return s.repo.Archive(ctx, id)
}

func (s *ProjectService) InviteMember(ctx context.Context, projectID, inviterID, email string, role domain.Role) (domain.ProjectMember, error) {
	inviterRole, err := s.repo.GetUserRole(ctx, projectID, inviterID)
	if err != nil {
		return domain.ProjectMember{}, err
	}
	if inviterRole != domain.RoleOwner && inviterRole != domain.RoleEditor {
		return domain.ProjectMember{}, domain.ErrForbidden
	}

	if s.userResolver == nil {
		return domain.ProjectMember{}, domain.ErrInternal
	}

	targetUser, err := s.userResolver.GetUserByEmail(ctx, email)
	if err != nil {
		return domain.ProjectMember{}, domain.ErrNotFound
	}

	return s.repo.AddMember(ctx, projectID, targetUser.ID, role, inviterID)
}

func (s *ProjectService) UpdateMemberRole(ctx context.Context, projectID, requesterID, targetID string, role domain.Role) (domain.ProjectMember, error) {
	requesterRole, err := s.repo.GetUserRole(ctx, projectID, requesterID)
	if err != nil {
		return domain.ProjectMember{}, err
	}
	if requesterRole != domain.RoleOwner {
		return domain.ProjectMember{}, domain.ErrForbidden
	}

	return s.repo.UpdateMemberRole(ctx, projectID, targetID, role)
}

func (s *ProjectService) RemoveMember(ctx context.Context, projectID, requesterID, targetID string) error {
	requesterRole, err := s.repo.GetUserRole(ctx, projectID, requesterID)
	if err != nil {
		return err
	}
	if requesterRole != domain.RoleOwner && requesterID != targetID {
		return domain.ErrForbidden
	}

	return s.repo.RemoveMember(ctx, projectID, targetID)
}
