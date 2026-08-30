.PHONY: dev dev-db dev-api dev-web build test clean

# Start local infrastructure (Postgres)
dev-db:
	docker compose -f docker-compose.dev.yml up -d postgres

# Start Go API
dev-api:
	cd apps/api && go run ./cmd/api

# Start React Web
dev-web:
	cd apps/web && npm run dev

# Run all tests
test:
	cd apps/api && go test ./pkg/... ./config/... ./internal/...

# Run benchmarks
bench:
	cd apps/api && go test -bench=. -benchmem ./tests/bench/...

# Production docker build & run
prod-up:
	docker compose up -d --build

prod-down:
	docker compose down
