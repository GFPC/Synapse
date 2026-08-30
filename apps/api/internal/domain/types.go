package domain

import (
	"encoding/json"
	"errors"
	"time"
)

// ────────────────────────────────────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────────────────────────────────────

type NodeType string

const (
	NodeTypeProblem    NodeType = "problem"
	NodeTypeSolution   NodeType = "solution"
	NodeTypeDecision   NodeType = "decision"
	NodeTypeFeature    NodeType = "feature"
	NodeTypeComponent  NodeType = "component"
	NodeTypeRisk       NodeType = "risk"
	NodeTypeTest       NodeType = "test"
	NodeTypeBenchmark  NodeType = "benchmark"
	NodeTypeNote       NodeType = "note"
	NodeTypeLesson     NodeType = "lesson"
	NodeTypeLink       NodeType = "link"
	NodeTypeDeployment NodeType = "deployment"
	NodeTypeLog        NodeType = "log"
)

// ValidNodeTypes is the set of all valid node types for validation.
var ValidNodeTypes = map[NodeType]bool{
	NodeTypeProblem: true, NodeTypeSolution: true, NodeTypeDecision: true,
	NodeTypeFeature: true, NodeTypeComponent: true, NodeTypeRisk: true,
	NodeTypeTest: true, NodeTypeBenchmark: true, NodeTypeNote: true,
	NodeTypeLesson: true, NodeTypeLink: true, NodeTypeDeployment: true,
	NodeTypeLog: true,
}

type Visibility string

const (
	VisibilityInternal Visibility = "internal"
	VisibilityShared   Visibility = "shared"
)

type Role string

const (
	RoleOwner  Role = "owner"
	RoleEditor Role = "editor"
	RoleViewer Role = "viewer"
)

type RelationType string

const (
	RelationTypeDerivesFrom RelationType = "derives_from"
	RelationTypeSupersedes  RelationType = "supersedes"
	RelationTypeImplements  RelationType = "implements"
	RelationTypeValidates   RelationType = "validates"
	RelationTypeCausedBy    RelationType = "caused_by"
	RelationTypeDependsOn   RelationType = "depends_on"
	RelationTypeContradicts RelationType = "contradicts"
	RelationTypeReferences  RelationType = "references"
	RelationTypeRelated     RelationType = "related"
)

// ────────────────────────────────────────────────────────────────────────────
// Entities
// ────────────────────────────────────────────────────────────────────────────

type User struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Email        string    `json:"email"`
	PasswordHash string    `json:"-"`
	AvatarURL    string    `json:"avatar_url,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type UserBrief struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	AvatarURL string `json:"avatar_url,omitempty"`
}

type Workspace struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	OwnerID   string    `json:"owner_id"`
	CreatedAt time.Time `json:"created_at"`
}

type Project struct {
	ID          string          `json:"id"`
	WorkspaceID string          `json:"workspace_id"`
	Name        string          `json:"name"`
	Status      string          `json:"status"`
	Type        *string         `json:"type,omitempty"`
	Description *string         `json:"description,omitempty"`
	Tags        []string        `json:"tags"`
	NodeCounts  map[string]int64 `json:"node_counts,omitempty"`
	Role        Role            `json:"role,omitempty"` // viewer's role in this project
	Members     []ProjectMember `json:"members,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}

type ProjectMember struct {
	ProjectID string    `json:"project_id"`
	UserID    string    `json:"user_id"`
	UserName  string    `json:"user_name,omitempty"`
	UserEmail string    `json:"user_email,omitempty"`
	UserAvatar string   `json:"user_avatar,omitempty"`
	Role      Role      `json:"role"`
	InvitedBy *string   `json:"invited_by,omitempty"`
	InvitedAt time.Time `json:"invited_at"`
}

type Node struct {
	ID         string          `json:"id"`
	ProjectID  *string         `json:"project_id"`
	AuthorID   *string         `json:"author_id,omitempty"`
	Author     *UserBrief      `json:"author,omitempty"`
	Type       NodeType        `json:"type"`
	Title      string          `json:"title"`
	Content    string          `json:"content"`
	Meta       json.RawMessage `json:"meta"`
	Status     *string         `json:"status,omitempty"`
	Visibility Visibility      `json:"visibility"`
	Tags       []string        `json:"tags"`
	DisplayID  string          `json:"display_id"`
	CanvasX    float64         `json:"canvas_x"`
	CanvasY    float64         `json:"canvas_y"`
	CreatedAt  time.Time       `json:"created_at"`
	UpdatedAt  time.Time       `json:"updated_at"`
}

type NodeBrief struct {
	ID        string   `json:"id"`
	Type      NodeType `json:"type"`
	Title     string   `json:"title"`
	DisplayID string   `json:"display_id"`
	Status    *string  `json:"status,omitempty"`
}

type Relation struct {
	ID         string       `json:"id"`
	FromNodeID string       `json:"from_node_id"`
	ToNodeID   string       `json:"to_node_id"`
	Type       RelationType `json:"type"`
	Note       *string      `json:"note,omitempty"`
	AuthorID   *string      `json:"author_id,omitempty"`
	CreatedAt  time.Time    `json:"created_at"`
}

type RelationWithNode struct {
	Relation
	Node NodeBrief `json:"node"`
}

type Comment struct {
	ID         string     `json:"id"`
	NodeID     string     `json:"node_id"`
	AuthorID   *string    `json:"author_id,omitempty"`
	Author     *UserBrief `json:"author,omitempty"`
	ReplyToID  *string    `json:"reply_to_id,omitempty"`
	Content    string     `json:"content"`
	EditedAt   *time.Time `json:"edited_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	Replies    []Comment  `json:"replies,omitempty"`
	Reactions  []Reaction `json:"reactions,omitempty"`
}

type Reaction struct {
	CommentID string    `json:"comment_id"`
	UserID    string    `json:"user_id"`
	Emoji     string    `json:"emoji"`
	CreatedAt time.Time `json:"created_at"`
}

type Attachment struct {
	ID          string    `json:"id"`
	NodeID      string    `json:"node_id"`
	AuthorID    *string   `json:"author_id,omitempty"`
	Type        string    `json:"type"` // image | file | embed
	Filename    *string   `json:"filename,omitempty"`
	StoragePath *string   `json:"-"`
	EmbedURL    *string   `json:"embed_url,omitempty"`
	MimeType    *string   `json:"mime_type,omitempty"`
	SizeBytes   *int64    `json:"size_bytes,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
}

type SearchResult struct {
	Node    NodeBrief `json:"node"`
	Snippet string    `json:"snippet"`
	Rank    float64   `json:"rank"`
}

type SearchMeta struct {
	Total  int64   `json:"total"`
	TookMs float64 `json:"took_ms"`
}

// ────────────────────────────────────────────────────────────────────────────
// Pagination
// ────────────────────────────────────────────────────────────────────────────

type PageMeta struct {
	Cursor  string `json:"cursor,omitempty"`
	HasMore bool   `json:"has_more"`
}

type Page[T any] struct {
	Data []T      `json:"data"`
	Meta PageMeta `json:"meta"`
}

// ────────────────────────────────────────────────────────────────────────────
// Errors
// ────────────────────────────────────────────────────────────────────────────

var (
	ErrNotFound     = errors.New("not found")
	ErrUnauthorized = errors.New("unauthorized")
	ErrForbidden    = errors.New("forbidden")
	ErrConflict     = errors.New("conflict")
	ErrBadRequest   = errors.New("bad request")
	ErrInternal     = errors.New("internal error")
)

// ────────────────────────────────────────────────────────────────────────────
// Input types
// ────────────────────────────────────────────────────────────────────────────

type CreateNodeInput struct {
	Type       NodeType        `json:"type"        validate:"required"`
	Title      string          `json:"title"       validate:"required,min=1,max=500"`
	Content    string          `json:"content"`
	Meta       json.RawMessage `json:"meta"`
	Status     *string         `json:"status"`
	Visibility Visibility      `json:"visibility"`
	Tags       []string        `json:"tags"`
	CanvasX    float64         `json:"canvas_x"`
	CanvasY    float64         `json:"canvas_y"`
}

type UpdateNodeInput struct {
	Title      *string         `json:"title"       validate:"omitempty,min=1,max=500"`
	Content    *string         `json:"content"`
	Meta       json.RawMessage `json:"meta"`
	Status     *string         `json:"status"`
	Visibility *Visibility     `json:"visibility"`
	Tags       []string        `json:"tags"`
}

type ListNodesParams struct {
	ProjectID  string
	UserID     string
	UserRole   Role
	TypeFilter string
	Visibility string
	Tags       []string
	Cursor     string
	Limit      int
}

type CreateRelationInput struct {
	ToNodeID string       `json:"to_node_id"  validate:"required"`
	Type     RelationType `json:"type"        validate:"required"`
	Note     *string      `json:"note"`
}

type CreateProjectInput struct {
	Name        string   `json:"name"        validate:"required,min=1,max=200"`
	Type        *string  `json:"type"`
	Description *string  `json:"description"`
	Tags        []string `json:"tags"`
}

type UpdateProjectInput struct {
	Name        *string  `json:"name"        validate:"omitempty,min=1,max=200"`
	Status      *string  `json:"status"`
	Type        *string  `json:"type"`
	Description *string  `json:"description"`
	Tags        []string `json:"tags"`
}

type CreateCommentInput struct {
	Content   string  `json:"content"    validate:"required,min=1,max=10000"`
	ReplyToID *string `json:"reply_to_id"`
}
