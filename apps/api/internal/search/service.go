package search

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/synapse/api/internal/domain"
)

type SearchParams struct {
	Query     string
	ProjectID *string
	NodeType  *string
	UserID    string
	Limit     int
}

type SearchMeta struct {
	Total  int64   `json:"total"`
	TookMs float64 `json:"took_ms"`
}

type SearchService struct {
	pool *pgxpool.Pool
}

func NewService(pool *pgxpool.Pool) *SearchService {
	return &SearchService{pool: pool}
}

func NewSearchService(pool *pgxpool.Pool) *SearchService {
	return &SearchService{pool: pool}
}

func (s *SearchService) Search(ctx context.Context, params SearchParams) ([]domain.SearchResult, SearchMeta, error) {
	start := time.Now()

	q := `
	SELECT 
		n.id, n.type, n.title, n.display_id,
		ts_headline('russian', n.content, websearch_to_tsquery('russian', $1)) as snippet,
		ts_rank(n.search_vector, websearch_to_tsquery('russian', $1)) as rank
	FROM nodes n
	JOIN project_members pm ON pm.project_id = n.project_id AND pm.user_id = $2
	WHERE n.search_vector @@ websearch_to_tsquery('russian', $1)
	  AND ($3::text IS NULL OR n.project_id = $3)
	  AND ($4::text IS NULL OR n.type = $4)
	  AND (pm.role != 'viewer' OR n.visibility = 'shared')
	ORDER BY rank DESC
	LIMIT $5
	`

	var results []domain.SearchResult
	rows, err := s.pool.Query(ctx, q, params.Query, params.UserID, params.ProjectID, params.NodeType, params.Limit)
	if err != nil {
		return nil, SearchMeta{}, err
	}
	defer rows.Close()

	for rows.Next() {
		var res domain.SearchResult
		if err := rows.Scan(&res.Node.ID, &res.Node.Type, &res.Node.Title, &res.Node.DisplayID, &res.Snippet, &res.Rank); err != nil {
			return nil, SearchMeta{}, err
		}
		results = append(results, res)
	}

	meta := SearchMeta{
		Total:  int64(len(results)),
		TookMs: float64(time.Since(start).Milliseconds()),
	}

	return results, meta, nil
}
