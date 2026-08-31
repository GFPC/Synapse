package quickdrop

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/google/uuid"
	"github.com/synapse/api/internal/domain"
	"github.com/synapse/api/internal/ws"
)

type Service struct {
	repo      Repository
	hub       *ws.Hub
	uploadDir string
}

func NewService(repo Repository, hub *ws.Hub, uploadDir string) *Service {
	return &Service{
		repo:      repo,
		hub:       hub,
		uploadDir: uploadDir,
	}
}

func (s *Service) Create(ctx context.Context, userID string, input domain.CreateQuickDropInput) (domain.QuickDrop, error) {
	if strings.TrimSpace(input.Content) == "" {
		return domain.QuickDrop{}, domain.ErrBadRequest
	}
	if input.Type == "" {
		input.Type = "text"
	}

	qd, err := s.repo.Create(ctx, userID, input)
	if err != nil {
		return domain.QuickDrop{}, err
	}

	if s.hub != nil {
		s.hub.BroadcastToUser(userID, ws.Event{
			Type: ws.EventQuickDropCreated,
			Data: qd,
		})
	}

	return qd, nil
}

func (s *Service) UploadFile(ctx context.Context, userID string, file multipart.File, header *multipart.FileHeader) (domain.QuickDrop, error) {
	buf := make([]byte, 512)
	n, err := file.Read(buf)
	if err != nil && err != io.EOF {
		return domain.QuickDrop{}, domain.ErrInternal
	}
	mimeType := http.DetectContentType(buf[:n])
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return domain.QuickDrop{}, domain.ErrInternal
	}

	isImage := strings.HasPrefix(mimeType, "image/")
	dropType := "file"
	if isImage {
		dropType = "image"
	}

	dir := filepath.Join(s.uploadDir, "quickdrop", userID)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return domain.QuickDrop{}, domain.ErrInternal
	}

	ext := filepath.Ext(header.Filename)
	if ext == "" && isImage {
		ext = ".png"
	}
	newFileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)
	dstPath := filepath.Join(dir, newFileName)

	dst, err := os.Create(dstPath)
	if err != nil {
		return domain.QuickDrop{}, domain.ErrInternal
	}
	defer dst.Close()

	written, err := io.Copy(dst, file)
	if err != nil {
		return domain.QuickDrop{}, domain.ErrInternal
	}

	contentURL := fmt.Sprintf("/data/uploads/quickdrop/%s/%s", userID, newFileName)
	metaJSON := fmt.Sprintf(`{"filename": %q, "mime_type": %q, "size_bytes": %d}`, header.Filename, mimeType, written)

	input := domain.CreateQuickDropInput{
		Type:     dropType,
		Content:  contentURL,
		Metadata: []byte(metaJSON),
		IsPinned: false,
	}

	return s.Create(ctx, userID, input)
}

func (s *Service) List(ctx context.Context, userID string) ([]domain.QuickDrop, error) {
	return s.repo.ListByUser(ctx, userID, 100)
}

func (s *Service) TogglePin(ctx context.Context, id, userID string) (domain.QuickDrop, error) {
	qd, err := s.repo.TogglePin(ctx, id, userID)
	if err != nil {
		return domain.QuickDrop{}, err
	}

	if s.hub != nil {
		s.hub.BroadcastToUser(userID, ws.Event{
			Type: ws.EventQuickDropPinned,
			Data: qd,
		})
	}

	return qd, nil
}

func (s *Service) Delete(ctx context.Context, id, userID string) error {
	err := s.repo.Delete(ctx, id, userID)
	if err != nil {
		return err
	}

	if s.hub != nil {
		s.hub.BroadcastToUser(userID, ws.Event{
			Type: ws.EventQuickDropDeleted,
			Data: map[string]string{"id": id},
		})
	}

	return nil
}

func (s *Service) ClearUnpinned(ctx context.Context, userID string) error {
	err := s.repo.ClearUnpinned(ctx, userID)
	if err != nil {
		return err
	}

	if s.hub != nil {
		s.hub.BroadcastToUser(userID, ws.Event{
			Type: ws.EventQuickDropDeleted,
			Data: map[string]string{"cleared": "unpinned"},
		})
	}

	return nil
}