# Build variables
BINARY_NAME=synapse-api
MAIN_PATH=cmd/api/main.go

.PHONY: all build test test-unit test-integration bench bench-profile generate migrate-up migrate-down lint coverage coverage-html docker-build run

all: build

build:
	go build -o bin/$(BINARY_NAME) $(MAIN_PATH)

test: test-unit test-integration

test-unit:
	go test -v -short ./...

test-integration:
	go test -v -tags=integration ./...

bench:
	go test -bench=. -benchmem ./...

bench-profile:
	go test -bench=. -benchmem -cpuprofile cpu.prof -memprofile mem.prof ./...

generate:
	go generate ./...

migrate-up:
	migrate -path migrations -database "${DATABASE_URL}" -verbose up

migrate-down:
	migrate -path migrations -database "${DATABASE_URL}" -verbose down

lint:
	golangci-lint run

coverage:
	go test -coverprofile=coverage.out ./...
	go tool cover -func=coverage.out

coverage-html: coverage
	go tool cover -html=coverage.out

docker-build:
	docker build -t $(BINARY_NAME) .

run: build
	./bin/$(BINARY_NAME)
