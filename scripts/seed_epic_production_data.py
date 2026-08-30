import json
import urllib.request
import urllib.error
import sys

BASE_URL = "http://87.58.204.138"

def post(endpoint, data, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        }
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode("utf-8"))

def patch(endpoint, data, token=None):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            **({"Authorization": f"Bearer {token}"} if token else {})
        },
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode("utf-8"))

def main():
    print("1. Authenticating as Lead Architect...")
    auth = post("/api/auth/login", {"email": "architect@synapse.local", "password": "password123"})
    token = None
    if "data" in auth and "tokens" in auth["data"]:
        token = auth["data"]["tokens"]["access_token"]
    else:
        reg = post("/api/auth/register", {
            "name": "Lead Architect",
            "email": "architect@synapse.local",
            "password": "password123"
        })
        if "data" in reg and "tokens" in reg["data"]:
            token = reg["data"]["tokens"]["access_token"]
        else:
            print("Auth error:", reg)
            return

    # =========================================================================
    # PROJECT 1: Synapse Core Architecture & Event Mesh (v2.4)
    # =========================================================================
    print("2. Creating Project 1: Synapse Cloud & Real-time Knowledge Engine...")
    proj1 = post("/api/projects", {
        "name": "Synapse Cloud & Real-time Knowledge Engine",
        "description": "Enterprise-scale distributed knowledge graph, bi-directional event mesh, and cognitive canvas with sub-millisecond query execution.",
        "tags": ["core-architecture", "go-backend", "postgres", "react-canvas", "realtime", "c++-core"]
    }, token)
    
    p1_id = proj1["data"]["id"]
    print(f"Project 1 ID: {p1_id}")

    nodes_p1 = [
        # --- Edge & Gateway Cluster ---
        {
            "type": "component",
            "title": "Edge Gateway & Reverse Proxy (Nginx)",
            "content": "Perimeter reverse proxy terminating TLS 1.3, handling Brotli compression, client SSL certificate validation and HTTP/2 multiplexing.",
            "status": "completed",
            "tags": ["gateway", "nginx", "tls", "network"],
            "canvas_x": 100,
            "canvas_y": 100
        },
        {
            "type": "feature",
            "title": "Bi-directional WebSocket Room Multiplexer",
            "content": "Hub-based connection pooling with room sharding broadcasting graph state diffs, soft locks and cursors to participants.",
            "status": "completed",
            "tags": ["ws", "realtime", "concurrency"],
            "canvas_x": 420,
            "canvas_y": 100
        },
        {
            "type": "component",
            "title": "Token Bucket Rate Limiter (100 RPS / 50 Burst)",
            "content": "IP-based rate limiter per second with strict 10 RPS throttle on authentication and JWT refresh endpoints.",
            "status": "completed",
            "tags": ["security", "rate-limit", "ddos"],
            "canvas_x": 100,
            "canvas_y": 320
        },

        # --- Core Microservices & Computation ---
        {
            "type": "component",
            "title": "Synapse API Core Engine (Go Echo)",
            "content": "Sub-millisecond REST and event dispatch router written in Go with pgxpool connection pooling and Prometheus metrics instrumentation.",
            "status": "completed",
            "tags": ["go", "echo", "rest-api", "microservice"],
            "canvas_x": 420,
            "canvas_y": 320
        },
        {
            "type": "component",
            "title": "Synapse C++ Spatial Engine (QuadTree & Layout)",
            "content": "Native C++ 2D Bounding Box spatial indexing for 10,000+ nodes (<0.05ms) with Force-Directed physical simulation.",
            "status": "completed",
            "tags": ["c++", "spatial-index", "quadtree", "layout"],
            "canvas_x": 760,
            "canvas_y": 320
        },
        {
            "type": "decision",
            "title": "ADR-001: Adopt PostgreSQL tsvector with GIN Index for FTS",
            "content": "Decision: Avoid standalone OpenSearch cluster to minimize RAM footprint. Use Russian/English stemming dictionaries in Postgres (15ms SLO).",
            "status": "completed",
            "tags": ["adr", "postgres", "fts", "decision"],
            "canvas_x": 760,
            "canvas_y": 100
        },
        {
            "type": "decision",
            "title": "ADR-002: Dual-Token JWT with Sliding Refresh Window",
            "content": "Access token expires in 15 minutes (stateless). Refresh token valid for 7 days, rotated on each refresh invocation.",
            "status": "completed",
            "tags": ["adr", "security", "jwt", "auth"],
            "canvas_x": 420,
            "canvas_y": 540
        },

        # --- Benchmarks & Performance ---
        {
            "type": "benchmark",
            "title": "FTS Benchmark: 0.12ms Latency @ 5,000 Nodes",
            "content": "GIN index query latency benchmarked under 100 concurrent workers with zero memory spikes and 100% precision.",
            "status": "completed",
            "tags": ["benchmark", "p99", "postgres", "performance"],
            "canvas_x": 1100,
            "canvas_y": 100
        },
        {
            "type": "benchmark",
            "title": "WebSocket Throughput: 25,000 Concurrent Connections",
            "content": "Hub broadcasting 50,000 events/sec across 250 active rooms with sub-5ms delivery latency.",
            "status": "completed",
            "tags": ["benchmark", "websocket", "load-test"],
            "canvas_x": 1100,
            "canvas_y": 320
        },

        # --- Storage & Database ---
        {
            "type": "component",
            "title": "Relational & Graph Hybrid Database (PostgreSQL 16)",
            "content": "ACID transactional tables for nodes, relations, comments and workspace permissions with optimized pgx pool.",
            "status": "completed",
            "tags": ["postgres", "storage", "sql", "acid"],
            "canvas_x": 1100,
            "canvas_y": 540
        },
        {
            "type": "deployment",
            "title": "Automated GitHub Actions CI/CD Pipeline",
            "content": "Multi-stage pipeline running go test -race, oxlint, tsc, docker build and automated SSH production deploy.",
            "status": "completed",
            "tags": ["devops", "ci-cd", "github-actions", "docker"],
            "canvas_x": 100,
            "canvas_y": 540
        },

        # --- Problems, Solutions & Incidents ---
        {
            "type": "problem",
            "title": "Concurrent Canvas Node Modification Races",
            "content": "Multiple users editing the same node coordinates simultaneously cause flickering and lost updates.",
            "status": "closed",
            "tags": ["concurrency", "race-condition", "bug"],
            "canvas_x": 760,
            "canvas_y": 540
        },
        {
            "type": "solution",
            "title": "Ephemeral Mutex Soft-Lock Store",
            "content": "In-memory thread-safe LockStore with 10-minute auto-expiry and ticker cleanup to isolate active editors.",
            "status": "completed",
            "tags": ["locking", "go-sync", "solution"],
            "canvas_x": 760,
            "canvas_y": 740
        },
        {
            "type": "risk",
            "title": "Postgres Connection Exhaustion under Sudden Traffic Spikes",
            "content": "Unbounded WebSocket clients opening individual DB connections could exhaust pgxpool limit (max 20 conns).",
            "status": "in_progress",
            "tags": ["risk", "database", "high-load"],
            "canvas_x": 1100,
            "canvas_y": 740
        },
        {
            "type": "lesson",
            "title": "Lesson: Zero-Allocation Keyset Pagination beats OFFSET",
            "content": "Keyset cursor-based pagination using (updated_at, id) maintained consistent 1ms response times even on large tables.",
            "status": "completed",
            "tags": ["lesson", "best-practice", "database"],
            "canvas_x": 420,
            "canvas_y": 740
        }
    ]

    print("Seeding nodes for Project 1...")
    p1_nodes = {}
    for n in nodes_p1:
        res = post(f"/api/projects/{p1_id}/nodes", n, token)
        if "data" in res:
            p1_nodes[n["title"]] = res["data"]["id"]
            patch(f"/api/nodes/{res['data']['id']}/canvas", {
                "canvas_x": n["canvas_x"],
                "canvas_y": n["canvas_y"]
            }, token)

    print("Creating relations for Project 1...")
    p1_relations = [
        ("Edge Gateway & Reverse Proxy (Nginx)", "Synapse API Core Engine (Go Echo)", "depends_on", "Маршрутизация REST запросов"),
        ("Bi-directional WebSocket Room Multiplexer", "Synapse API Core Engine (Go Echo)", "implements", "Событийный мультиплексор"),
        ("Token Bucket Rate Limiter (100 RPS / 50 Burst)", "Edge Gateway & Reverse Proxy (Nginx)", "implements", "Защита периметра"),
        ("Synapse API Core Engine (Go Echo)", "Relational & Graph Hybrid Database (PostgreSQL 16)", "depends_on", "Хранение данных через pgxpool"),
        ("ADR-001: Adopt PostgreSQL tsvector with GIN Index for FTS", "Relational & Graph Hybrid Database (PostgreSQL 16)", "implements", "Полнотекстовый индекс"),
        ("FTS Benchmark: 0.12ms Latency @ 5,000 Nodes", "ADR-001: Adopt PostgreSQL tsvector with GIN Index for FTS", "validates", "Подтверждение бенчмарком"),
        ("Synapse C++ Spatial Engine (QuadTree & Layout)", "Synapse API Core Engine (Go Echo)", "implements", "Быстрый расчет координат"),
        ("WebSocket Throughput: 25,000 Concurrent Connections", "Bi-directional WebSocket Room Multiplexer", "validates", "Нагрузочное тестирование"),
        ("Concurrent Canvas Node Modification Races", "Ephemeral Mutex Soft-Lock Store", "derives_from", "Решение гонки редактирования"),
        ("Ephemeral Mutex Soft-Lock Store", "Bi-directional WebSocket Room Multiplexer", "validates", "Блокировка перед вещанием"),
        ("Automated GitHub Actions CI/CD Pipeline", "Edge Gateway & Reverse Proxy (Nginx)", "validates", "Автодеплой контейнеров"),
        ("Postgres Connection Exhaustion under Sudden Traffic Spikes", "Relational & Graph Hybrid Database (PostgreSQL 16)", "caused_by", "Ограничение пула соединений"),
        ("Lesson: Zero-Allocation Keyset Pagination beats OFFSET", "Relational & Graph Hybrid Database (PostgreSQL 16)", "validates", "Оптимизация пагинации")
    ]

    for from_t, to_t, rel_type, note in p1_relations:
        from_id = p1_nodes.get(from_t)
        to_id = p1_nodes.get(to_t)
        if from_id and to_id:
            post("/api/nodes/relations", {
                "from_node_id": from_id,
                "to_node_id": to_id,
                "type": rel_type,
                "note": note
            }, token)

    # Add comments with discussions & reactions
    target_node = p1_nodes.get("ADR-001: Adopt PostgreSQL tsvector with GIN Index for FTS")
    if target_node:
        c1 = post(f"/api/nodes/{target_node}/comments", {
            "content": "Отличное решение! Мы избавились от оверхеда OpenSearch и сэкономили 3GB оперативной памяти на проде."
        }, token)
        if "data" in c1:
            post(f"/api/comments/{c1['data']['id']}/reactions", {"emoji": "👍"}, token)
            post(f"/api/comments/{c1['data']['id']}/reactions", {"emoji": "❤️"}, token)

    # =========================================================================
    # PROJECT 2: High-Frequency FinTech Settlement & Ledger Pipeline
    # =========================================================================
    print("3. Creating Project 2: High-Frequency FinTech Settlement Pipeline...")
    proj2 = post("/api/projects", {
        "name": "High-Frequency FinTech Settlement & Ledger Pipeline",
        "description": "Ultra low-latency double-entry ledger, Raft-replicated order matcher, and automated clearing house settlement architecture.",
        "tags": ["fintech", "ledger", "raft", "event-sourcing", "distributed", "low-latency"]
    }, token)
    
    p2_id = proj2["data"]["id"]
    print(f"Project 2 ID: {p2_id}")

    nodes_p2 = [
        {
            "type": "component",
            "title": "Ingress FIX/Websocket Gateway",
            "content": "Ultra low latency ingress parser handling binary FIX 5.0 SP2 and WebSocket market orders.",
            "status": "completed",
            "tags": ["fintech", "fix-protocol", "gateway"],
            "canvas_x": 100,
            "canvas_y": 150
        },
        {
            "type": "component",
            "title": "LMAX Disruptor Order Matcher (C++ 20)",
            "content": "Single-writer lock-free ring buffer processing 6,000,000 orders/sec with <800ns median latency.",
            "status": "completed",
            "tags": ["matching-engine", "c++", "lock-free", "lmax"],
            "canvas_x": 450,
            "canvas_y": 150
        },
        {
            "type": "decision",
            "title": "ADR-101: Immutable Double-Entry Ledger Event Sourcing",
            "content": "All financial balance modifications strictly modeled as append-only debits and credits. No in-place balance updates.",
            "status": "completed",
            "tags": ["accounting", "event-sourcing", "adr", "ledger"],
            "canvas_x": 800,
            "canvas_y": 150
        },
        {
            "type": "component",
            "title": "Raft Consensus Log Replicator",
            "content": "Distributed 5-node Raft cluster guaranteeing zero data loss across 3 availability zones.",
            "status": "completed",
            "tags": ["raft", "consensus", "distributed", "ha"],
            "canvas_x": 450,
            "canvas_y": 380
        },
        {
            "type": "problem",
            "title": "Network Partition Brain-Split in Multi-DC Setup",
            "content": "Cross-region fiber cut caused split-brain quorum failure in secondary datacenter.",
            "status": "closed",
            "tags": ["incident", "network", "split-brain"],
            "canvas_x": 100,
            "canvas_y": 380
        },
        {
            "type": "solution",
            "title": "Quorum Witness Node with Pre-Vote Phase",
            "content": "Implemented Raft pre-vote extension and tie-breaker witness in third independent cloud region.",
            "status": "completed",
            "tags": ["solution", "raft", "pre-vote"],
            "canvas_x": 800,
            "canvas_y": 380
        },
        {
            "type": "benchmark",
            "title": "Settlement Throughput: 450,000 TPS on NVMe",
            "content": "Sequential fsync WAL throughput on enterprise NVMe SSD arrays with p99.99 under 1.2ms.",
            "status": "completed",
            "tags": ["benchmark", "throughput", "nvme", "storage"],
            "canvas_x": 1150,
            "canvas_y": 150
        },
        {
            "type": "risk",
            "title": "Flash Crash Liquidity Cascade Risk",
            "content": "Rapid price drops triggering cascade stop-loss executions overwhelming clearing house margins.",
            "status": "in_progress",
            "tags": ["risk", "market", "volatility"],
            "canvas_x": 1150,
            "canvas_y": 380
        }
    ]

    p2_nodes = {}
    for n in nodes_p2:
        res = post(f"/api/projects/{p2_id}/nodes", n, token)
        if "data" in res:
            p2_nodes[n["title"]] = res["data"]["id"]
            patch(f"/api/nodes/{res['data']['id']}/canvas", {
                "canvas_x": n["canvas_x"],
                "canvas_y": n["canvas_y"]
            }, token)

    p2_relations = [
        ("Ingress FIX/Websocket Gateway", "LMAX Disruptor Order Matcher (C++ 20)", "depends_on", "Подача ордеров в матчинг"),
        ("LMAX Disruptor Order Matcher (C++ 20)", "ADR-101: Immutable Double-Entry Ledger Event Sourcing", "implements", "Генерация транзакций"),
        ("LMAX Disruptor Order Matcher (C++ 20)", "Raft Consensus Log Replicator", "depends_on", "Репликация журнала"),
        ("Settlement Throughput: 450,000 TPS on NVMe", "ADR-101: Immutable Double-Entry Ledger Event Sourcing", "validates", "Бенчмарк записи"),
        ("Network Partition Brain-Split in Multi-DC Setup", "Quorum Witness Node with Pre-Vote Phase", "derives_from", "Устранение сплит-брейна"),
        ("Quorum Witness Node with Pre-Vote Phase", "Raft Consensus Log Replicator", "implements", "Защита кворума"),
        ("Flash Crash Liquidity Cascade Risk", "LMAX Disruptor Order Matcher (C++ 20)", "caused_by", "Лавинный поток стоп-лоссов")
    ]

    for from_t, to_t, rel_type, note in p2_relations:
        from_id = p2_nodes.get(from_t)
        to_id = p2_nodes.get(to_t)
        if from_id and to_id:
            post("/api/nodes/relations", {
                "from_node_id": from_id,
                "to_node_id": to_id,
                "type": rel_type,
                "note": note
            }, token)

    print("SUCCESS: Both projects and mega architecture schemes populated on production server!")

if __name__ == "__main__":
    main()
