import os
import paramiko
import sys

HOST = os.getenv("SSH_HOST", "87.58.204.138")
USER = os.getenv("SSH_USER", "root")
PASS = os.getenv("SSH_PASSWORD", "yC2H8JuJMUknb")

def run():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {HOST}...")
    client.connect(HOST, username=USER, password=PASS, timeout=15)
    print("Connected successfully!\n")

    commands = [
        ("OS & Kernel", "uname -a; cat /etc/os-release | grep PRETTY_NAME"),
        ("CPU & Memory", "lscpu | grep 'Model name\\|CPU(s):'; free -m"),
        ("Disk Usage", "df -h /"),
        ("Running Services (Check for VPN)", "systemctl list-units --type=service --state=running | grep -E -i 'vpn|wireguard|wg|amnezia|xray|v2ray|outline|openvpn|shadowsocks|tailscale' || echo 'No systemd VPN service matched pattern'"),
        ("Network Interfaces", "ip -brief address"),
        ("Listening Ports", "ss -tulpn"),
        ("Docker & Docker Compose", "docker --version 2>&1 || echo 'Docker not found'; docker compose version 2>&1 || echo 'Compose not found'; docker ps -a 2>&1"),
    ]

    for title, cmd in commands:
        print(f"=== {title} ===")
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='ignore').strip()
        err = stderr.read().decode('utf-8', errors='ignore').strip()
        if out:
            print(out)
        if err:
            print(f"[ERR] {err}")
        print()

    client.close()

if __name__ == "__main__":
    run()
