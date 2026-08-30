import json
import urllib.request
import urllib.error

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

def main():
    print("1. Registering/Logging in as Lead Architect...")
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

    print("2. Creating Mega Architecture Project...")
    proj_res = post("/api/projects", {
        "name": "Synapse Distributed Knowledge & Event Grid",
        "description": "High-throughput real-time knowledge graph, event streaming engine and cognitive canvas architecture.",
        "tags": ["core-architecture", "go-backend", "react-canvas", "realtime", "event-driven", "postgres"]
    }, token)
    
    if "data" not in proj_res:
        print("Project error:", proj_res)
        return
    
    project_id = proj_res["data"]["id"]
    print(f"Project created: {project_id}")

    # Nodes to generate with canvas coordinates
    nodes_data = [
        # Ingestion & Gateway
        {
            "type": "component",
            "title": "Edge Gateway & Reverse Proxy (Nginx)",
            "content": "Handles TLS termination, WebSocket upgrades, Brotli/Gzip compression and rate limiting at the perimeter.",
            "status": "in_progress",
            "tags": ["network", "gateway", "nginx"],
            "canvas_x": 100,
            "canvas_y": 200
        },
        {
            "type": "feature",
            "title": "Bi-directional WebSocket Room Multiplexer",
            "content": "Hub-based connection pooling broadcasting graph state diffs, soft locks and cursors to room participants.",
            "status": "in_progress",
            "tags": ["ws", "realtime", "concurrency"],
            "canvas_x": 400,
            "canvas_y": 150
        },
        {
            "type": "problem",
            "title": "Concurrent Canvas Node Modification Races",
            "content": "Multiple users editing the same node coordinates simultaneously cause flickering and lost updates.",
            "status": "closed",
            "tags": ["concurrency", "distributed", "race-condition"],
            "canvas_x": 400,
            "canvas_y": -50
        },
        {
            "type": "solution",
            "title": "Ephemeral Mutex Soft-Lock Store",
            "content": "In-memory thread-safe LockStore with 10-minute auto-expiry and ticker cleanup to isolate active editors.",
            "status": "completed",
            "tags": ["locking", "go-sync", "solution"],
            "canvas_x": 700,
            "canvas_y": -50
        },
        # Core Processing
        {
            "type": "component",
            "title": "Synapse API Core Engine (Go Echo)",
            "content": "Sub-millisecond REST and event dispatch router written in Go with pgxpool connection pooling.",
            "status": "completed",
            "tags": ["go", "echo", "rest-api", "microservice"],
            "canvas_x": 700,
            "canvas_y": 200
        },
        {
            "type": "decision",
            "title": "Adopt PostgreSQL 16 tsvector for Full-Text Search",
            "content": "Instead of running Elastic/OpenSearch which needs 2GB+ RAM, use Postgres tsvector with GIN index (15ms SLO).",
            "status": "completed",
            "tags": ["architecture", "postgres", "fts", "decision"],
            "canvas_x": 1000,
            "canvas_y": 80
        },
        {
            "type": "benchmark",
            "title": "PostgreSQL Full-Text Search: 0.12ms on 5,000 Nodes",
            "content": "GIN index query latency benchmarked under 100 concurrent workers with zero memory spikes.",
            "status": "completed",
            "tags": ["benchmark", "performance", "postgres"],
            "canvas_x": 1300,
            "canvas_y": 80
        },
        # Storage
        {
            "type": "component",
            "title": "Relational & Graph Hybrid Storage (Postgres 16)",
            "content": "ACID transactional tables for nodes, relations, comments and workspace permissions with optimized pgx pool.",
            "status": "completed",
            "tags": ["postgres", "storage", "sql"],
            "canvas_x": 1000,
            "canvas_y": 280
        },
        # Frontend
        {
            "type": "component",
            "title": "Interactive React Flow Cognitive Canvas",
            "content": "Infinite zooming canvas with SVG edge routing, dynamic layouting, minimap and node inspection drawers.",
            "status": "in_progress",
            "tags": ["react", "canvas", "reactflow", "tailwind"],
            "canvas_x": 400,
            "canvas_y": 420
        },
        {
            "type": "feature",
            "title": "Multi-Layer Tree & Hierarchical Layout",
            "content": "D3 hierarchy and Dagre graph layout algorithms organizing nodes by dependency level and category.",
            "status": "in_progress",
            "tags": ["layout", "graph-theory", "d3"],
            "canvas_x": 700,
            "canvas_y": 420
        },
        {
            "type": "deployment",
            "title": "Automated GitHub Actions CI/CD Pipeline",
            "content": "Multi-stage pipeline running go test -race, oxlint, tsc, docker build and automated SSH production deploy.",
            "status": "completed",
            "tags": ["devops", "ci-cd", "github-actions", "docker"],
            "canvas_x": 100,
            "canvas_y": 420
        }
    ]

    print("3. Seeding nodes...")
    created_nodes = {}
    for n in nodes_data:
        res = post(f"/api/projects/{project_id}/nodes", n, token)
        if "data" in res:
            created_nodes[n["title"]] = res["data"]["id"]
            # Set canvas position
            post(f"/api/nodes/{res['data']['id']}/canvas", {
                "canvas_x": n["canvas_x"],
                "canvas_y": n["canvas_y"]
            }, token)
            print(f"Created node: {res['data']['display_id']} - {n['title']}")

    print("4. Creating relations...")
    relations_data = [
        ("Edge Gateway & Reverse Proxy (Nginx)", "Synapse API Core Engine (Go Echo)", "depends_on"),
        ("Bi-directional WebSocket Room Multiplexer", "Synapse API Core Engine (Go Echo)", "implements"),
        ("Concurrent Canvas Node Modification Races", "Ephemeral Mutex Soft-Lock Store", "derives_from"),
        ("Ephemeral Mutex Soft-Lock Store", "Bi-directional WebSocket Room Multiplexer", "validates"),
        ("Synapse API Core Engine (Go Echo)", "Relational & Graph Hybrid Storage (Postgres 16)", "depends_on"),
        ("Adopt PostgreSQL 16 tsvector for Full-Text Search", "Relational & Graph Hybrid Storage (Postgres 16)", "implements"),
        ("PostgreSQL Full-Text Search: 0.12ms on 5,000 Nodes", "Adopt PostgreSQL 16 tsvector for Full-Text Search", "validates"),
        ("Interactive React Flow Cognitive Canvas", "Edge Gateway & Reverse Proxy (Nginx)", "depends_on"),
        ("Multi-Layer Tree & Hierarchical Layout", "Interactive React Flow Cognitive Canvas", "implements"),
        ("Automated GitHub Actions CI/CD Pipeline", "Edge Gateway & Reverse Proxy (Nginx)", "validates")
    ]

    for from_title, to_title, rel_type in relations_data:
        from_id = created_nodes.get(from_title)
        to_id = created_nodes.get(to_title)
        if from_id and to_id:
            post("/api/nodes/relations", {
                "from_node_id": from_id,
                "to_node_id": to_id,
                "type": rel_type,
                "note": f"Graph connection between {from_title} and {to_title}"
            }, token)
            print(f"Connected {from_title} -> {to_title} ({rel_type})")

    print("\n✅ Mega Scheme Generated Successfully on Production Server!")

if __name__ == "__main__":
    main()
