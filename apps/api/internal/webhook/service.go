package webhook

import (
	"context"
	"regexp"
	"strings"
	"time"

	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/internal/ws"
)

var nodeIDRegex = regexp.MustCompile(`(?i)([A-Z]-\d{3})`)

type Service struct {
	repo *Repository
	hub  *ws.Hub
}

func NewService(repo *Repository, hub *ws.Hub) *Service {
	return &Service{repo: repo, hub: hub}
}

type GitHubPushPayload struct {
	Ref        string `json:"ref"`
	Repository struct {
		FullName string `json:"full_name"`
		HTMLURL  string `json:"html_url"`
	} `json:"repository"`
	Commits []struct {
		ID        string `json:"id"`
		Message   string `json:"message"`
		Timestamp string `json:"timestamp"`
		Author    struct {
			Name  string `json:"name"`
			Email string `json:"email"`
		} `json:"author"`
	} `json:"commits"`
}

type GitHubPRPayload struct {
	Action      string `json:"action"` // "opened", "closed", "reopened"
	PullRequest struct {
		Number    int    `json:"number"`
		HTMLURL   string `json:"html_url"`
		Title     string `json:"title"`
		Body      string `json:"body"`
		Merged    bool   `json:"merged"`
		MergedAt  *string `json:"merged_at"`
		Head      struct {
			Ref string `json:"ref"`
		} `json:"head"`
		User struct {
			Login string `json:"login"`
		} `json:"user"`
	} `json:"pull_request"`
	Repository struct {
		FullName string `json:"full_name"`
		HTMLURL  string `json:"html_url"`
	} `json:"repository"`
}

func (s *Service) HandlePush(ctx context.Context, payload GitHubPushPayload) error {
	repoSlug := payload.Repository.FullName
	proj, err := s.repo.FindProjectByRepo(ctx, repoSlug)
	if err != nil {
		// Project not linked to this repo
		return nil
	}

	branch := strings.TrimPrefix(payload.Ref, "refs/heads/")
	branchMatches := nodeIDRegex.FindAllString(branch, -1)

	for _, commit := range payload.Commits {
		nodeIDs := make(map[string]bool)
		for _, m := range branchMatches {
			nodeIDs[strings.ToUpper(m)] = true
		}
		for _, m := range nodeIDRegex.FindAllString(commit.Message, -1) {
			nodeIDs[strings.ToUpper(m)] = true
		}

		for displayID := range nodeIDs {
			node, err := s.repo.FindNodeByDisplayID(ctx, proj.ID, displayID)
			if err != nil || node == nil {
				continue
			}

			repoURL := payload.Repository.HTMLURL
			c := &domain.NodeCommit{
				NodeID:     node.ID,
				CommitHash: commit.ID,
				Message:    commit.Message,
				Author:     commit.Author.Name,
				Branch:     &branch,
				RepoURL:    &repoURL,
				CreatedAt:  time.Now(),
			}
			_ = s.repo.InsertCommit(ctx, c)

			// Update status if draft
			if node.Status == nil || *node.Status == "draft" {
				_ = s.repo.UpdateNodeStatus(ctx, node.ID, "in_progress")
				s.hub.BroadcastToProject(proj.ID, ws.Event{
					Type: ws.EventNodeUpdated,
					Data: map[string]string{"id": node.ID, "status": "in_progress"},
				}, "")
			}
		}
	}

	return nil
}

func (s *Service) HandlePullRequest(ctx context.Context, payload GitHubPRPayload) error {
	repoSlug := payload.Repository.FullName
	proj, err := s.repo.FindProjectByRepo(ctx, repoSlug)
	if err != nil {
		return nil
	}

	targetNodeIDs := make(map[string]bool)
	for _, m := range nodeIDRegex.FindAllString(payload.PullRequest.Head.Ref, -1) {
		targetNodeIDs[strings.ToUpper(m)] = true
	}
	for _, m := range nodeIDRegex.FindAllString(payload.PullRequest.Title, -1) {
		targetNodeIDs[strings.ToUpper(m)] = true
	}
	for _, m := range nodeIDRegex.FindAllString(payload.PullRequest.Body, -1) {
		targetNodeIDs[strings.ToUpper(m)] = true
	}

	prStatus := "open"
	if payload.PullRequest.Merged {
		prStatus = "merged"
	} else if payload.Action == "closed" {
		prStatus = "closed"
	}

	var mergedAt *time.Time
	if payload.PullRequest.MergedAt != nil {
		t, err := time.Parse(time.RFC3339, *payload.PullRequest.MergedAt)
		if err == nil {
			mergedAt = &t
		}
	}

	for displayID := range targetNodeIDs {
		node, err := s.repo.FindNodeByDisplayID(ctx, proj.ID, displayID)
		if err != nil || node == nil {
			continue
		}

		repoURL := payload.Repository.HTMLURL
		author := payload.PullRequest.User.Login
		pr := &domain.NodePullRequest{
			NodeID:    node.ID,
			PRNumber:  payload.PullRequest.Number,
			PRURL:     payload.PullRequest.HTMLURL,
			Title:     payload.PullRequest.Title,
			Status:    prStatus,
			Author:    &author,
			MergedAt:  mergedAt,
			RepoURL:   &repoURL,
			CreatedAt: time.Now(),
		}
		_ = s.repo.UpsertPullRequest(ctx, pr)

		if prStatus == "merged" {
			_ = s.repo.UpdateNodeStatus(ctx, node.ID, "completed")
			s.hub.BroadcastToProject(proj.ID, ws.Event{
				Type: ws.EventNodeUpdated,
				Data: map[string]string{"id": node.ID, "status": "completed"},
			}, "")
		}
	}

	return nil
}
