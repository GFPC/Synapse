# Synapse — Collaborative Engineering Knowledge Base

> High-performance collaborative graph workspace & engineering knowledge base.

---

## 📁 Repository Structure

```text
Synapse/
├── apps/
│   ├── api/             # Go 1.23+ Clean Architecture Backend (Echo + pgxpool + PostgreSQL 16)
│   ├── web/             # React 19 + TypeScript + Vite + React Flow Frontend
│   └── mobile/          # (Planned) Android Client
│
├── deploy/
│   ├── docker/          # Multi-stage production Dockerfiles
│   │   ├── Dockerfile.api
│   │   └── Dockerfile.web
│   └── nginx/           # Nginx reverse proxy configuration
│       └── default.conf
│
├── docs/                # Architecture specifications & documentation
│   └── architecture.md
│
├── scripts/             # Automation and seed scripts
├── docker-compose.yml   # Full stack production orchestration
├── docker-compose.dev.yml # Local development infrastructure (Postgres)
├── Makefile             # Root developer commands
└── .env.example         # Environment variables template
```

---

## 🚀 Quick Start

### 1. Local Development

Start the local PostgreSQL container:
```bash
docker compose -f docker-compose.dev.yml up -d
```

Start the Go Backend:
```bash
cd apps/api
go run ./cmd/api
```

Start the React Frontend:
```bash
cd apps/web
npm install
npm run dev
```

### 2. Full Stack in Docker (Production Mode)

```bash
docker compose up -d --build
```
The application will be live at:
- **Web & API Gateway**: `http://localhost`
- **Backend API**: `http://localhost/api`
- **WebSocket**: `ws://localhost/ws`

---

## 🧪 Testing & Benchmarks

Run Go unit tests:
```bash
cd apps/api
go test ./pkg/... ./config/... ./internal/...
```

Run Go performance benchmarks:
```bash
cd apps/api
go test -bench=. -benchmem ./tests/bench/...
```
