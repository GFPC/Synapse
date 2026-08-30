import os
import paramiko
import sys
import time

# Ensure UTF-8 output on Windows console
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
sys.stderr.reconfigure(encoding='utf-8', errors='replace')

HOST = os.getenv("SSH_HOST", "87.58.204.138")
USER = os.getenv("SSH_USER", "root")
PASS = os.getenv("SSH_PASSWORD", "yC2H8JuJMUknb")

def run_cmd(client, cmd, ignore_error=False):
    print(f"\n>>> Running: {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
    
    # Stream output safely
    while True:
        line = stdout.readline()
        if not line:
            break
        try:
            print(line, end="", flush=True)
        except Exception:
            pass
    
    exit_status = stdout.channel.recv_exit_status()
    if exit_status != 0 and not ignore_error:
        err = stderr.read().decode('utf-8', errors='ignore')
        print(f"\n[ERROR] Command failed with exit code {exit_status}: {err}")
        raise RuntimeError(f"Command failed: {cmd}")
    return exit_status

def deploy():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {HOST}...")
    client.connect(HOST, username=USER, password=PASS, timeout=30)
    print("Connected successfully!\n")

    # Step 1: Ensure Docker is installed and running
    docker_check = """
    systemctl enable docker
    systemctl start docker
    docker --version
    docker compose version
    """
    run_cmd(client, docker_check)

    # Step 2: Clone or update repo in /opt/synapse
    repo_cmds = """
    if [ -d "/opt/synapse/.git" ]; then
        echo "Updating existing repository..."
        cd /opt/synapse && git fetch origin && git reset --hard origin/main
    else
        echo "Cloning repository..."
        rm -rf /opt/synapse
        git clone https://github.com/GFPC/Synapse.git /opt/synapse
    fi
    """
    run_cmd(client, repo_cmds)

    # Step 3: Configure production .env in /opt/synapse
    env_cmds = """
    cat << 'EOF' > /opt/synapse/.env
ENV=production
PORT=3000

# Database
DATABASE_URL=postgres://synapse:synapse_prod_pass_9281@postgres:5432/synapse?sslmode=disable
POSTGRES_USER=synapse
POSTGRES_PASSWORD=synapse_prod_pass_9281
POSTGRES_DB=synapse

# Auth
JWT_SECRET=synapse_prod_jwt_super_secret_key_8492018374628190
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=168h

# Uploads
UPLOAD_DIR=/data/uploads
MAX_FILE_SIZE_MB=50

# WebSocket
WS_MAX_MESSAGE_SIZE=65536
WS_WRITE_WAIT=10s
WS_PONG_WAIT=60s
WS_PING_PERIOD=54s

# Rate Limit
RATE_LIMIT_RPS=100
RATE_LIMIT_BURST=50
EOF
    """
    run_cmd(client, env_cmds)

    # Step 4: Build and start Docker Compose stack
    docker_cmds = """
    cd /opt/synapse
    docker compose down --remove-orphans || true
    docker compose build
    docker compose up -d
    """
    run_cmd(client, docker_cmds)

    # Step 5: Wait for healthcheck and verify
    print("\nWaiting for containers to initialize and become healthy (15s)...")
    time.sleep(15)

    verify_cmds = """
    echo "=== Container Status ==="
    docker compose -f /opt/synapse/docker-compose.yml ps

    echo "=== Healthcheck Endpoint ==="
    curl -s http://localhost/health || curl -s http://localhost:3000/health

    echo "=== VPN Service Status (Must be running) ==="
    systemctl status xray --no-pager | head -n 10

    echo "=== Docker Resource Stats ==="
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}"

    echo "=== Total System RAM ==="
    free -m
    """
    run_cmd(client, verify_cmds)

    client.close()
    print("\nDeployment completed successfully!")

if __name__ == "__main__":
    deploy()
