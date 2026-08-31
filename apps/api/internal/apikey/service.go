package apikey

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/pkg/id"
	"golang.org/x/crypto/bcrypt"
)

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Create(ctx context.Context, userID string, input domain.CreateApiKeyInput) (*domain.CreateApiKeyResult, error) {
	// Generate random 32-byte secret (64 hex chars)
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return nil, fmt.Errorf("generate random key: %w", err)
	}
	rawSecret := hex.EncodeToString(b)
	fullKey := fmt.Sprintf("syn_live_%s", rawSecret)
	prefix := fullKey[:16] // e.g. "syn_live_a1b2c3d4"

	// Hash with sha256 before bcrypt for deterministic length & security
	sha := sha256.Sum256([]byte(fullKey))
	hashBytes, err := bcrypt.GenerateFromPassword(sha[:], bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash api key: %w", err)
	}

	perms := input.Permissions
	if len(perms) == 0 {
		perms = []string{"read", "write"}
	}

	var expiresAt *time.Time
	if input.ExpiresIn != nil && *input.ExpiresIn != "" {
		d, err := parseDurationStr(*input.ExpiresIn)
		if err == nil && d > 0 {
			exp := time.Now().Add(d)
			expiresAt = &exp
		}
	}

	apiKey := domain.ApiKey{
		ID:          id.NewID(),
		UserID:      userID,
		Name:        input.Name,
		KeyHash:     string(hashBytes),
		KeyPrefix:   prefix,
		Permissions: perms,
		ExpiresAt:   expiresAt,
		CreatedAt:   time.Now(),
	}

	if err := s.repo.Create(ctx, &apiKey); err != nil {
		return nil, fmt.Errorf("save api key: %w", err)
	}

	return &domain.CreateApiKeyResult{
		ApiKey: apiKey,
		Key:    fullKey,
	}, nil
}

func (s *Service) List(ctx context.Context, userID string) ([]domain.ApiKey, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s *Service) Delete(ctx context.Context, id, userID string) error {
	return s.repo.Delete(ctx, id, userID)
}

type AuthUser struct {
	UserID      string
	Email       string
	Permissions []string
}

func (s *Service) ValidateKey(ctx context.Context, fullKey string) (*AuthUser, error) {
	if len(fullKey) < 20 || fullKey[:9] != "syn_live_" {
		return nil, domain.ErrUnauthorized
	}
	prefix := fullKey[:16]

	candidates, err := s.repo.GetByPrefix(ctx, prefix)
	if err != nil || len(candidates) == 0 {
		return nil, domain.ErrUnauthorized
	}

	sha := sha256.Sum256([]byte(fullKey))

	for _, cand := range candidates {
		// Check expiry
		if cand.ExpiresAt != nil && cand.ExpiresAt.Before(time.Now()) {
			continue
		}

		if err := bcrypt.CompareHashAndPassword([]byte(cand.KeyHash), sha[:]); err == nil {
			// Matched!
			go s.repo.UpdateLastUsed(context.Background(), cand.ID)

			email, _ := s.repo.GetUserEmail(ctx, cand.UserID)
			return &AuthUser{
				UserID:      cand.UserID,
				Email:       email,
				Permissions: cand.Permissions,
			}, nil
		}
	}

	return nil, domain.ErrUnauthorized
}

func parseDurationStr(s string) (time.Duration, error) {
	switch s {
	case "30d":
		return 30 * 24 * time.Hour, nil
	case "90d":
		return 90 * 24 * time.Hour, nil
	case "1y":
		return 365 * 24 * time.Hour, nil
	default:
		return time.ParseDuration(s)
	}
}
