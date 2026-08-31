package ws

import (
	"encoding/json"
	"sync"
)

type EventType string

const (
	EventNodeCreated      EventType = "node_created"
	EventNodeUpdated      EventType = "node_updated"
	EventNodeDeleted      EventType = "node_deleted"
	EventRelationCreated  EventType = "relation_created"
	EventCommentAdded     EventType = "comment_added"
	EventNodeLocked       EventType = "node_locked"
	EventNodeUnlocked     EventType = "node_unlocked"
	EventUserOnline       EventType = "user_online"
	EventQuickDropCreated EventType = "quick_drop_created"
	EventQuickDropDeleted EventType = "quick_drop_deleted"
	EventQuickDropPinned  EventType = "quick_drop_pinned"
	EventIdeaCreated      EventType = "idea_created"
	EventIdeaUpdated      EventType = "idea_updated"
	EventIdeaDeleted      EventType = "idea_deleted"
)

type Event struct {
	Type EventType   `json:"type"`
	Data interface{} `json:"data"`
}

type BroadcastMsg struct {
	ProjectID       string
	ExcludeClientID string
	Payload         []byte
}

type RoomChange struct {
	Client       *Client
	OldProjectID string
	NewProjectID string
}

type Hub struct {
	mu         sync.RWMutex
	rooms      map[string]map[*Client]struct{} // projectID -> clients
	broadcast  chan BroadcastMsg
	register   chan *Client
	unregister chan *Client
	changeRoom chan *RoomChange
}

func NewHub() *Hub {
	return &Hub{
		broadcast:  make(chan BroadcastMsg, 256),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		changeRoom: make(chan *RoomChange, 64),
		rooms:      make(map[string]map[*Client]struct{}),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			if _, ok := h.rooms[client.ProjectID]; !ok {
				h.rooms[client.ProjectID] = make(map[*Client]struct{})
			}
			h.rooms[client.ProjectID][client] = struct{}{}
			h.mu.Unlock()
		case change := <-h.changeRoom:
			h.mu.Lock()
			if change.OldProjectID != "" {
				if oldRoom, ok := h.rooms[change.OldProjectID]; ok {
					delete(oldRoom, change.Client)
					if len(oldRoom) == 0 {
						delete(h.rooms, change.OldProjectID)
					}
				}
			}
			if change.NewProjectID != "" {
				if _, ok := h.rooms[change.NewProjectID]; !ok {
					h.rooms[change.NewProjectID] = make(map[*Client]struct{})
				}
				h.rooms[change.NewProjectID][change.Client] = struct{}{}
			}
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if room, ok := h.rooms[client.ProjectID]; ok {
				if _, ok := room[client]; ok {
					delete(room, client)
					close(client.send)
					if len(room) == 0 {
						delete(h.rooms, client.ProjectID)
					}
				}
			}
			h.mu.Unlock()
		case msg := <-h.broadcast:
			h.mu.Lock()
			if room, ok := h.rooms[msg.ProjectID]; ok {
				for client := range room {
					if client.ID != msg.ExcludeClientID {
						select {
						case client.send <- msg.Payload:
						default:
							close(client.send)
							delete(room, client)
						}
					}
				}
				if len(room) == 0 {
					delete(h.rooms, msg.ProjectID)
				}
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) RoomClientCount(projectID string) int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	if room, ok := h.rooms[projectID]; ok {
		return len(room)
	}
	return 0
}

func (h *Hub) BroadcastToProject(projectID string, event Event, excludeClientID string) {
	payload, err := json.Marshal(event)
	if err != nil {
		return
	}
	h.broadcast <- BroadcastMsg{
		ProjectID:       projectID,
		ExcludeClientID: excludeClientID,
		Payload:         payload,
	}
}

func (h *Hub) BroadcastToUser(userID string, event Event) {
	payload, err := json.Marshal(event)
	if err != nil {
		return
	}
	h.mu.RLock()
	defer h.mu.RUnlock()
	for _, room := range h.rooms {
		for client := range room {
			if client.UserID == userID {
				select {
				case client.send <- payload:
				default:
				}
			}
		}
	}
}

