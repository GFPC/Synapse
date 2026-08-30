package ws

import (
	"context"
	"sync"
	"time"
)

type Lock struct {
	UserID    string
	UserName  string
	ExpiresAt time.Time
}

type LockStore struct {
	mu    sync.RWMutex
	locks map[string]*Lock // nodeID -> Lock
}

func NewLockStore() *LockStore {
	return &LockStore{
		locks: make(map[string]*Lock),
	}
}

func (s *LockStore) Acquire(nodeID, userID, userName string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	l, exists := s.locks[nodeID]
	if exists && time.Now().Before(l.ExpiresAt) && l.UserID != userID {
		return false
	}

	s.locks[nodeID] = &Lock{
		UserID:    userID,
		UserName:  userName,
		ExpiresAt: time.Now().Add(10 * time.Minute), // Soft lock expires after 10m
	}
	return true
}

func (s *LockStore) Release(nodeID, userID string) bool {
	s.mu.Lock()
	defer s.mu.Unlock()

	l, exists := s.locks[nodeID]
	if !exists {
		return true // already released
	}

	if l.UserID == userID {
		delete(s.locks, nodeID)
		return true
	}
	return false
}

func (s *LockStore) Get(nodeID string) *Lock {
	s.mu.RLock()
	defer s.mu.RUnlock()

	l, exists := s.locks[nodeID]
	if !exists {
		return nil
	}

	if time.Now().After(l.ExpiresAt) {
		return nil
	}
	return l
}

func (s *LockStore) Cleanup(ctx context.Context, broadcastUnlock func(nodeID string)) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			s.mu.Lock()
			now := time.Now()
			for nodeID, l := range s.locks {
				if now.After(l.ExpiresAt) {
					delete(s.locks, nodeID)
					s.mu.Unlock()
					if broadcastUnlock != nil {
						broadcastUnlock(nodeID)
					}
					s.mu.Lock()
				}
			}
			s.mu.Unlock()
		}
	}
}
