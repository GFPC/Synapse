package auth

import (
	"context"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/synapse/api/internal/domain"
	"golang.org/x/crypto/bcrypt"
)

type mockRepo struct {
	usersByEmail map[string]domain.User
	usersByID    map[string]domain.User
	createErr    error
}

func (m *mockRepo) CreateUserAndWorkspace(ctx context.Context, name, email, passwordHash string) (domain.User, error) {
	if m.createErr != nil {
		return domain.User{}, m.createErr
	}
	if _, exists := m.usersByEmail[email]; exists {
		return domain.User{}, domain.ErrConflict
	}
	user := domain.User{
		ID:           "u1",
		Name:         name,
		Email:        email,
		PasswordHash: passwordHash,
	}
	m.usersByEmail[email] = user
	m.usersByID[user.ID] = user
	return user, nil
}

func (m *mockRepo) GetUserByEmail(ctx context.Context, email string) (domain.User, error) {
	user, exists := m.usersByEmail[email]
	if !exists {
		return domain.User{}, domain.ErrNotFound
	}
	return user, nil
}

func (m *mockRepo) GetUserByID(ctx context.Context, id string) (domain.User, error) {
	user, exists := m.usersByID[id]
	if !exists {
		return domain.User{}, domain.ErrNotFound
	}
	return user, nil
}

func TestAuthService_Register(t *testing.T) {
	cfg := AuthConfig{JWTSecret: "secret", AccessTokenExp: time.Hour, RefreshTokenExp: time.Hour * 24}

	tests := []struct {
		name    string
		email   string
		setup   func(*mockRepo)
		wantErr bool
	}{
		{
			name:    "TestRegister_Success",
			email:   "test@example.com",
			setup:   func(m *mockRepo) {},
			wantErr: false,
		},
		{
			name:  "TestRegister_DuplicateEmail",
			email: "dup@example.com",
			setup: func(m *mockRepo) {
				m.usersByEmail["dup@example.com"] = domain.User{}
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			repo := &mockRepo{
				usersByEmail: make(map[string]domain.User),
				usersByID:    make(map[string]domain.User),
			}
			tt.setup(repo)
			svc := NewAuthServiceWithRepo(repo, cfg)

			tokens, user, err := svc.Register(context.Background(), "Name", tt.email, "password123")
			if (err != nil) != tt.wantErr {
				t.Errorf("AuthService.Register() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !tt.wantErr {
				if user.Email != tt.email {
					t.Errorf("Expected email %s, got %s", tt.email, user.Email)
				}
				if tokens.AccessToken == "" || tokens.RefreshToken == "" {
					t.Errorf("Expected tokens to be non-empty")
				}
			}
		})
	}
}

func TestAuthService_Login(t *testing.T) {
	cfg := AuthConfig{JWTSecret: "secret", AccessTokenExp: time.Hour, RefreshTokenExp: time.Hour * 24}
	hash, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.MinCost)

	repo := &mockRepo{
		usersByEmail: map[string]domain.User{
			"test@example.com": {ID: "1", Email: "test@example.com", PasswordHash: string(hash)},
		},
	}
	svc := NewAuthServiceWithRepo(repo, cfg)

	tests := []struct {
		name     string
		email    string
		password string
		wantErr  bool
	}{
		{
			name:     "TestLogin_Success",
			email:    "test@example.com",
			password: "password123",
			wantErr:  false,
		},
		{
			name:     "TestLogin_WrongPassword",
			email:    "test@example.com",
			password: "wrong",
			wantErr:  true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, _, err := svc.Login(context.Background(), tt.email, tt.password)
			if (err != nil) != tt.wantErr {
				t.Errorf("AuthService.Login() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}

func TestAuthService_RefreshToken(t *testing.T) {
	cfg := AuthConfig{JWTSecret: "secret", AccessTokenExp: time.Hour, RefreshTokenExp: time.Hour * 24}
	svc := NewAuthServiceWithRepo(&mockRepo{}, cfg)

	validToken := jwt.NewWithClaims(jwt.SigningMethodHS256, JWTClaims{
		UserID: "1",
		Email:  "test@example.com",
		Type:   "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	})
	validTokenStr, _ := validToken.SignedString([]byte("secret"))

	expiredToken := jwt.NewWithClaims(jwt.SigningMethodHS256, JWTClaims{
		UserID: "1",
		Email:  "test@example.com",
		Type:   "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-time.Hour)),
		},
	})
	expiredTokenStr, _ := expiredToken.SignedString([]byte("secret"))

	tests := []struct {
		name    string
		token   string
		wantErr bool
	}{
		{
			name:    "TestRefreshToken_Success",
			token:   validTokenStr,
			wantErr: false,
		},
		{
			name:    "TestRefreshToken_Expired",
			token:   expiredTokenStr,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := svc.RefreshToken(context.Background(), tt.token)
			if (err != nil) != tt.wantErr {
				t.Errorf("AuthService.RefreshToken() error = %v, wantErr %v", err, tt.wantErr)
			}
		})
	}
}
