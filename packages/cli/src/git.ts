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
    const match = origin.match(/[:\/]([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+?)(\.git)?$/);
    return match ? match[1] : '';
  }

  public static getNodeFromBranch(branch: string = this.getCurrentBranch()): string | null {
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

    // prepare-commit-msg hook: Checks .synapse-context first, then branch name!
    const prepareHook = `#!/bin/sh
# Synapse Git Hook ? Auto tag commit with active Synapse Node ID

NODE_ID=""

# 1. Check local .synapse-context
if [ -f ".synapse-context" ]; then
    NODE_ID=$(cat .synapse-context | tr -d ' \r\n' | tr '[:lower:]' '[:upper:]')
fi

# 2. Fallback to branch name if no context file
if [ -z "$NODE_ID" ]; then
    BRANCH_NAME=$(git symbolic-ref --short HEAD 2>/dev/null)
    NODE_ID=$(echo "$BRANCH_NAME" | grep -oE '[A-Za-z]-[0-9]{3}' | tr '[:lower:]' '[:upper:]')
fi

# 3. Inject into commit message
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

    // Add .synapse-key and .synapse-context to .gitignore
    const gitignorePath = path.join(root, '.gitignore');
    let gi = fs.existsSync(gitignorePath) ? fs.readFileSync(gitignorePath, 'utf-8') : '';
    let updated = false;
    if (!gi.includes('.synapse-key')) {
      gi += '\n# Synapse\n.synapse-key\n';
      updated = true;
    }
    if (!gi.includes('.synapse-context')) {
      gi += '.synapse-context\n';
      updated = true;
    }
    if (updated) {
      fs.writeFileSync(gitignorePath, gi, 'utf-8');
    }

    return { prepare: true, post: true };
  }
}
