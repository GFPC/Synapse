package attachment

import (
	"context"
	"errors"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"

	"github.com/google/uuid"
	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/internal/node"
)

var (
	ErrInvalidFileType = errors.New("invalid file type")
	ErrFileTooLarge    = errors.New("file too large")
	ErrUnauthorized    = errors.New("unauthorized")
	ErrNotFound        = errors.New("not found")
)

type Service struct {
	repo      Repository
	nodeRepo  node.Repository
	uploadDir string
	maxSizeMB int64
}

func NewService(repo Repository, nodeRepo node.Repository, uploadDir string, maxSizeMB int64) *Service {
	if maxSizeMB <= 0 {
		maxSizeMB = 50
	}
	return &Service{
		repo:      repo,
		nodeRepo:  nodeRepo,
		uploadDir: uploadDir,
		maxSizeMB: maxSizeMB,
	}
}

func (s *Service) Upload(ctx context.Context, nodeID, authorID string, file multipart.File, header *multipart.FileHeader, attachType string) (domain.Attachment, error) {
	if header.Size > s.maxSizeMB*1024*1024 {
		return domain.Attachment{}, ErrFileTooLarge
	}

	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return domain.Attachment{}, err
	}

	if _, err := file.Seek(0, 0); err != nil {
		return domain.Attachment{}, err
	}

	mimeType := http.DetectContentType(buffer[:n])
	if !isAllowedMime(mimeType, attachType) {
		return domain.Attachment{}, ErrInvalidFileType
	}

	ext := filepath.Ext(header.Filename)
	filename := uuid.New().String() + ext
	nodeDir := filepath.Join(s.uploadDir, nodeID)
	if err := os.MkdirAll(nodeDir, 0755); err != nil {
		return domain.Attachment{}, err
	}

	storagePath := filepath.Join(nodeDir, filename)
	out, err := os.Create(storagePath)
	if err != nil {
		return domain.Attachment{}, err
	}
	defer out.Close()

	if _, err := io.Copy(out, file); err != nil {
		return domain.Attachment{}, err
	}

	size := header.Size
	att := domain.Attachment{
		NodeID:      nodeID,
		AuthorID:    &authorID,
		Type:        attachType,
		Filename:    &header.Filename,
		StoragePath: &storagePath,
		MimeType:    &mimeType,
		SizeBytes:   &size,
	}

	return s.repo.Create(ctx, att)
}

func (s *Service) AddEmbed(ctx context.Context, nodeID, authorID, embedURL string) (domain.Attachment, error) {
	att := domain.Attachment{
		NodeID:   nodeID,
		AuthorID: &authorID,
		Type:     "embed",
		EmbedURL: &embedURL,
	}
	return s.repo.Create(ctx, att)
}

func (s *Service) GetByNode(ctx context.Context, nodeID string) ([]domain.Attachment, error) {
	return s.repo.GetByNode(ctx, nodeID)
}

func (s *Service) GetByID(ctx context.Context, id string) (domain.Attachment, error) {
	return s.repo.GetByID(ctx, id)
}

func (s *Service) Delete(ctx context.Context, id, userID string) error {
	att, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	if att.AuthorID == nil || *att.AuthorID != userID {
		_, role, err := s.nodeRepo.GetByID(ctx, att.NodeID, userID)
		if err != nil {
			return err
		}
		if role != domain.RoleOwner {
			return ErrUnauthorized
		}
	}

	if att.Type != "embed" && att.StoragePath != nil {
		_ = os.Remove(*att.StoragePath)
	}

	return s.repo.Delete(ctx, id)
}

func (s *Service) Download(ctx context.Context, id, userID string) (string, string, error) {
	att, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return "", "", err
	}

	if att.Type == "embed" || att.StoragePath == nil {
		return "", "", errors.New("attachment is an embed or missing file")
	}

	filename := "file"
	if att.Filename != nil {
		filename = *att.Filename
	}

	return *att.StoragePath, filename, nil
}

func isAllowedMime(mime string, t string) bool {
	allowedImages := map[string]bool{
		"image/jpeg": true, "image/png": true, "image/gif": true, "image/webp": true, "image/svg+xml": true,
	}
	allowedFiles := map[string]bool{
		"application/pdf": true, "application/vnd.ms-excel": true,
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": true,
		"text/plain": true, "text/csv": true, "application/zip": true, "application/x-zip-compressed": true,
	}

	if t == "image" {
		return allowedImages[mime]
	}
	if t == "file" {
		return allowedFiles[mime]
	}
	return false
}
