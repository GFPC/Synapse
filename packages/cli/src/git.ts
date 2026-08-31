import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export class Git {
  public static isGitRepo(root: string): boolean {
    return fs.existsSync(path.join(root, '.git'));
  }

  public static getCurrentBranch(): string {
    try {
      return execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['pipe', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      return '';
    }
  }

  public static getRemoteOrigin(): string {
    try {
      return execSync('git config --get remote.origin.url', { stdio: ['pipe', 'pipe', 'ignore'] })
        .toString()
        .trim();
    } catch {
      return '';
    }
  }

  public static getRepoSlug(): string {
    const origin = this.getRemoteOrigin();
    if (!origin) return '';
    // matches git@github.com:owner/repo.git or https://github.com/owner/repo.git
    const match = origin.match(/[:\/]([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+?)(\.git)?$/);
    return match ? match[1] : '';
  }

  public static getNodeFromBranch(branch: string = this.getCurrentBranch()): string | null {
    // Look for e.g. feat/C-002-order-matcher or C-002
    const match = branch.match(/([A-Z]-\d{3})/i);
    return match ? match[1].toUpperCase() : null;
  }

  public static checkoutBranch(branchName: string, create: boolean = false): boolean {
    try {
      const flag = create ? '-b' : '';
      execSync(`git checkout ${flag} ${branchName}`, { stdio: 'inherit' });
      return true;
    } catch {
      return false;
    }
  }

  public static installHooks(root: string): { prepare: boolean; post: boolean } {
    const hooksDir = path.join(root, '.git', 'hooks');
    if (!fs.existsSync(hooksDir)) {
      return { prepare: false, post: false };
    }

    // 1. prepare-commit-msg hook
    const prepareHook = `#!/bin/sh
# Synapse Git Hook ? Auto tag commit with Node ID from branch
BRANCH_NAME=$(git symbolic-ref --short HEAD 2>/dev/null)
NODE_ID=$(echo "$BRANCH_NAME" | grep -oE '[A-Za-z]-[0-9]{3}' | tr '[:lower:]' '[:upper:]')

if [ -n "$NODE_ID" ]; then
    COMMIT_MSG_FILE=$1
    FIRST_LINE=$(head -n1 "$COMMIT_MSG_FILE")
    # Only prepend if not already present
    if ! echo "$FIRST_LINE" | grep -q "$NODE_ID"; then
        echo "[$NODE_ID] $FIRST_LINE" > "$COMMIT_MSG_FILE.tmp"
        tail -n +2 "$COMMIT_MSG_FILE" >> "$COMMIT_MSG_FILE.tmp"
        mv "$COMMIT_MSG_FILE.tmp" "$COMMIT_MSG_FILE"
    fi
fi
`;
    const preparePath = path.join(hooksDir, 'prepare-commit-msg');
    fs.writeFileSync(preparePath, prepareHook, { mode: 0o755 });

    // 2. Add .synapse-key to .gitignore
    const gitignorePath = path.join(root, '.gitignore');
    let gi = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf-8') : '';
    if (!gi.includes('.synapse-key')) {
      gi += '\n# Synapse\n.synapse-key\n';
      fs.writeFileSync(gitignorePath, gi, 'utf-8');
    }

    return { prepare: true, post: true };
  }
}
