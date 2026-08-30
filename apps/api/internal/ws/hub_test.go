package ws

import (
	"context"
	"testing"
	"time"
)

func TestHub_RegisterUnregister(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	client := &Client{
		ID:        "1",
		ProjectID: "p1",
		send:      make(chan []byte, 10),
	}

	hub.register <- client
	time.Sleep(10 * time.Millisecond) // wait for channel to process

	if len(hub.rooms["p1"]) != 1 {
		t.Errorf("Expected 1 client in room p1, got %d", len(hub.rooms["p1"]))
	}

	hub.unregister <- client
	time.Sleep(10 * time.Millisecond)

	if len(hub.rooms["p1"]) != 0 {
		t.Errorf("Expected 0 clients in room p1, got %d", len(hub.rooms["p1"]))
	}
}

func TestHub_BroadcastToRoom(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	c1 := &Client{ID: "1", ProjectID: "p1", send: make(chan []byte, 10)}
	c2 := &Client{ID: "2", ProjectID: "p1", send: make(chan []byte, 10)}
	c3 := &Client{ID: "3", ProjectID: "p2", send: make(chan []byte, 10)}

	hub.register <- c1
	hub.register <- c2
	hub.register <- c3
	time.Sleep(10 * time.Millisecond)

	hub.BroadcastToProject("p1", Event{Type: EventNodeCreated, Data: nil}, "")
	time.Sleep(10 * time.Millisecond)

	if len(c1.send) != 1 {
		t.Errorf("c1 expected 1 message, got %d", len(c1.send))
	}
	if len(c2.send) != 1 {
		t.Errorf("c2 expected 1 message, got %d", len(c2.send))
	}
	if len(c3.send) != 0 {
		t.Errorf("c3 expected 0 messages, got %d", len(c3.send))
	}
}

func TestHub_BroadcastExcludesClient(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	c1 := &Client{ID: "1", ProjectID: "p1", send: make(chan []byte, 10)}
	c2 := &Client{ID: "2", ProjectID: "p1", send: make(chan []byte, 10)}

	hub.register <- c1
	hub.register <- c2
	time.Sleep(10 * time.Millisecond)

	hub.BroadcastToProject("p1", Event{Type: EventNodeCreated, Data: nil}, "1")
	time.Sleep(10 * time.Millisecond)

	if len(c1.send) != 0 {
		t.Errorf("c1 should have been excluded")
	}
	if len(c2.send) != 1 {
		t.Errorf("c2 expected 1 message")
	}
}

func TestHub_SlowClientDropped(t *testing.T) {
	hub := NewHub()
	go hub.Run()

	c1 := &Client{ID: "1", ProjectID: "p1", send: make(chan []byte, 1)}
	hub.register <- c1
	time.Sleep(10 * time.Millisecond)

	// Send more than buffer
	hub.BroadcastToProject("p1", Event{Type: EventNodeCreated, Data: nil}, "")
	hub.BroadcastToProject("p1", Event{Type: EventNodeCreated, Data: nil}, "")
	time.Sleep(10 * time.Millisecond)

	if len(hub.rooms["p1"]) != 0 {
		t.Errorf("Slow client should have been dropped")
	}
}

func TestLockStore_Acquire(t *testing.T) {
	store := NewLockStore()
	ok := store.Acquire("node1", "user1", "Alice")
	if !ok {
		t.Errorf("Expected to acquire lock")
	}
	
	lock := store.Get("node1")
	if lock == nil || lock.UserID != "user1" {
		t.Errorf("Lock not acquired properly")
	}
}

func TestLockStore_CantAcquireLockedByOther(t *testing.T) {
	store := NewLockStore()
	store.Acquire("node1", "user1", "Alice")
	
	ok := store.Acquire("node1", "user2", "Bob")
	if ok {
		t.Errorf("User2 should not be able to acquire lock")
	}
}

func TestLockStore_ExpiredLockCanBeAcquired(t *testing.T) {
	store := NewLockStore()
	store.Acquire("node1", "user1", "Alice")
	
	// Force expiration
	store.mu.Lock()
	store.locks["node1"].ExpiresAt = time.Now().Add(-1 * time.Minute)
	store.mu.Unlock()

	ok := store.Acquire("node1", "user2", "Bob")
	if !ok {
		t.Errorf("User2 should be able to acquire expired lock")
	}
}

func TestLockStore_Cleanup(t *testing.T) {
	store := NewLockStore()
	store.Acquire("node1", "user1", "Alice")
	
	// Force expiration
	store.mu.Lock()
	store.locks["node1"].ExpiresAt = time.Now().Add(-1 * time.Minute)
	store.mu.Unlock()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	cleaned := make(chan string, 1)
	go store.Cleanup(ctx, func(nodeID string) {
		cleaned <- nodeID
	})

	select {
	case <-cleaned:
		// success
	case <-time.After(11 * time.Second):
		t.Errorf("Cleanup did not occur in time") // Note: testing time.NewTicker(10s) takes 10s
	}
}
