# ? Synapse CLI (`@synapse/cli`)

> **Bridge the gap between architectural theory and daily code.**  
> Effortlessly tag Git commits with Architecture Node IDs, synchronize clipboard across mobile and PC in real time, pipe benchmark runs directly to architecture nodes, and explore the living system graph from your terminal.

---

## ?? Quickstart & Installation

### Option 1: Global Install (Recommended)
```bash
npm install -g @synapse/cli
```
*Gives you both `synapse` and the fast shortcut `syn` in any terminal.*

### Option 2: Run directly with `npx` (No install required)
```bash
npx @synapse/cli status
```

---

## ??? Commands Reference

### 1. Initialize Repository & Git Hooks
Connects your repository to the Synapse server, links your project, and installs smart Git hooks:
```bash
synapse init
```

### 2. View System Status
```bash
syn status
# or
synapse status
```
*Outputs live server ping latency, current user, active project, and currently selected architectural node.*

### 3. Browse Architecture Nodes
```bash
syn ls
# Filter by type:
syn ls --type component
syn ls --type decision
syn ls --type benchmark
```

### 4. Switch Active Node Context (Zero-Branch Pollution)
Work on any architectural node without creating unnecessary Git branches:
```bash
# Switch directly to node C-002:
syn use C-002

# Or pick interactively with arrow keys:
syn switch
```
*Your next `git commit` in this branch will automatically be tagged with `[C-002] ...`!*

### 5. Mark Node Completed / In Review
```bash
syn finish
```

### 6. Quick Drop (Live Clipboard Sync)
Send snippets, logs, or links directly to your mobile phone and team web canvas:
```bash
# Send text snippet:
syn drop "Checked LMAX ring buffer memory barrier: 0 cache misses"

# Pipe output from terminal commands:
git log -n 5 --oneline | syn drop
cat /var/log/nginx/error.log | syn drop

# View recent drops:
syn drops
```

### 7. Pipe Benchmark Runs to Architecture Nodes
```bash
go test -bench=. ./... | syn bench --node B-001
```

### 8. Capture Brainstorm Ideas
```bash
syn idea "Zero-copy eBPF FIX ingress gateway" -c "Bypass Linux network stack using XDP"
```

### 9. Open in Web Browser
```bash
syn open
syn open C-002
```

---

## ?? License
MIT ? Synapse Team
