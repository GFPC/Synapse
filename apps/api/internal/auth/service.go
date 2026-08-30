package auth

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/synapse/api/internal/domain"
	"golang.org/x/crypto/bcrypt"
)

type AuthConfig struct {
	JWTSecret           string
	AccessTokenExp      time.Duration
	RefreshTokenExp     time.Duration
}

type Tokens struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
}

type JWTClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Type   string `json:"type"`
	jwt.RegisteredClaims
}

type Repository interface {
	CreateUserAndWorkspace(ctx context.Context, name, email, passwordHash string) (domain.User, error)
	GetUserByEmail(ctx context.Context, email string) (domain.User, error)
	GetUserByID(ctx context.Context, id string) (domain.User, error)
}

type pgxRepository struct {
	pool *pgxpool.Pool
}

func (r *pgxRepository) CreateUserAndWorkspace(ctx context.Context, name, email, passwordHash string) (domain.User, error) {
	tx, err := r.pool.Begin(ctx)
	if err != nil {
		return domain.User{}, err
	}
	defer tx.Rollback(ctx)

	var user domain.User
	err = tx.QueryRow(ctx, `
		INSERT INTO users (name, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id, name, email, created_at, updated_at
	`, name, email, passwordHash).Scan(&user.ID, &user.Name, &user.Email, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return domain.User{}, err
	}

	workspaceName := fmt.Sprintf("%s's Workspace", name)
	_, err = tx.Exec(ctx, `
		INSERT INTO workspaces (name, owner_id)
		VALUES ($1, $2)
	`, workspaceName, user.ID)
	if err != nil {
		return domain.User{}, err
	}

	if err := tx.Commit(ctx); err != nil {
		return domain.User{}, err
	}
	return user, nil
}

func (r *pgxRepository) GetUserByEmail(ctx context.Context, email string) (domain.User, error) {
	var user domain.User
	err := r.pool.QueryRow(ctx, `
		SELECT id, name, email, password_hash, created_at, updated_at
		FROM users WHERE email = $1
	`, email).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, domain.ErrNotFound
		}
		return domain.User{}, err
	}
	return user, nil
}

func (r *pgxRepository) GetUserByID(ctx context.Context, id string) (domain.User, error) {
	var user domain.User
	err := r.pool.QueryRow(ctx, `
		SELECT id, name, email, password_hash, created_at, updated_at
		FROM users WHERE id = $1
	`, id).Scan(&user.ID, &user.Name, &user.Email, &user.PasswordHash, &user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return domain.User{}, domain.ErrNotFound
		}
		return domain.User{}, err
	}
	return user, nil
}

type AuthService struct {
	repo Repository
	cfg  AuthConfig
}

type Config = AuthConfig

func NewRepository(pool *pgxpool.Pool) Repository {
	return &pgxRepository{pool: pool}
}

func NewService(repo Repository, cfg AuthConfig) *AuthService {
	return &AuthService{
		repo: repo,
		cfg:  cfg,
	}
}

func NewAuthService(pool *pgxpool.Pool, cfg AuthConfig) *AuthService {
	return &AuthService{
		repo: &pgxRepository{pool: pool},
		cfg:  cfg,
	}
}

func NewAuthServiceWithRepo(repo Repository, cfg AuthConfig) *AuthService {
	return &AuthService{
		repo: repo,
		cfg:  cfg,
	}
}

func (s *AuthService) generateTokens(userID, email string) (Tokens, error) {
	accessClaims := JWTClaims{
		UserID: userID,
		Email:  email,
		Type:   "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.cfg.AccessTokenExp)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	accessToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return Tokens{}, err
	}

	refreshClaims := JWTClaims{
		UserID: userID,
		Email:  email,
		Type:   "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.cfg.RefreshTokenExp)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	refreshToken, err := jwt.NewWithClaims(jwt.SigningMethodHS256, refreshClaims).SignedString([]byte(s.cfg.JWTSecret))
	if err != nil {
		return Tokens{}, err
	}

	return Tokens{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}, nil
}

func (s *AuthService) Register(ctx context.Context, name, email, password string) (Tokens, domain.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		return Tokens{}, domain.User{}, err
	}

	user, err := s.repo.CreateUserAndWorkspace(ctx, name, email, string(hash))
	if err != nil {
		return Tokens{}, domain.User{}, err
	}

	tokens, err := s.generateTokens(user.ID, user.Email)
	return tokens, user, err
}

func (s *AuthService) Login(ctx context.Context, email, password string) (Tokens, domain.User, error) {
	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, domain.ErrNotFound) {
			return Tokens{}, domain.User{}, domain.ErrUnauthorized
		}
		return Tokens{}, domain.User{}, err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return Tokens{}, domain.User{}, domain.ErrUnauthorized
	}

	tokens, err := s.generateTokens(user.ID, user.Email)
	return tokens, user, err
}

func (s *AuthService) RefreshToken(ctx context.Context, refreshToken string) (string, error) {
	token, err := jwt.ParseWithClaims(refreshToken, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.cfg.JWTSecret), nil
	})
	if err != nil {
		return "", domain.ErrUnauthorized
	}

	claims, ok := token.Claims.(*JWTClaims)
	if !ok || !token.Valid || claims.Type != "refresh" {
		return "", domain.ErrUnauthorized
	}

	accessClaims := JWTClaims{
		UserID: claims.UserID,
		Email:  claims.Email,
		Type:   "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(s.cfg.AccessTokenExp)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, accessClaims).SignedString([]byte(s.cfg.JWTSecret))
}

func (s *AuthService) GetMe(ctx context.Context, userID string) (domain.User, error) {
	return s.repo.GetUserByID(ctx, userID)
}
