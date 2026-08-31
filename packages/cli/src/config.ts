import fs from 'fs';
import path from 'path';
import yaml from 'yaml';

export interface SynapseProjectConfig {
  server: string;
  project?: string;
  projectName?: string;
  github?: {
    repo?: string;
    webhook_id?: number;
  };
  hooks?: {
    prepareCommitMsg?: boolean;
    postCommit?: boolean;
  };
}

const CONFIG_FILE = '.synapse.yml';
const KEY_FILE = '.synapse-key';
const GLOBAL_DIR = path.join(process.env.USERPROFILE || process.env.HOME || '', '.synapse');
const GLOBAL_CONFIG = path.join(GLOBAL_DIR, 'config.json');

export function findRoot(dir: string = process.cwd()): string {
  let curr = dir;
  while (curr !== path.dirname(curr)) {
    if (fs.existsSync(path.join(curr, CONFIG_FILE)) || fs.existsSync(path.join(curr, '.git'))) {
      return curr;
    }
    curr = path.dirname(curr);
  }
  return dir;
}

export function loadConfig(root: string = findRoot()): SynapseProjectConfig {
  const cfgPath = path.join(root, CONFIG_FILE);
  if (fs.existsSync(cfgPath)) {
    try {
      const content = fs.readFileSync(cfgPath, 'utf-8');
      return yaml.parse(content) || {};
    } catch {
      // fallback
    }
  }
  return {
    server: process.env.SYNAPSE_API_URL || 'http://87.58.204.138',
  };
}

export function saveConfig(config: SynapseProjectConfig, root: string = findRoot()): void {
  const cfgPath = path.join(root, CONFIG_FILE);
  fs.writeFileSync(cfgPath, yaml.stringify(config), 'utf-8');
}

export function loadApiKey(root: string = findRoot()): string | null {
  // 1. Env var
  if (process.env.SYNAPSE_API_KEY) {
    return process.env.SYNAPSE_API_KEY.trim();
  }

  // 2. Local repo key
  const localKey = path.join(root, KEY_FILE);
  if (fs.existsSync(localKey)) {
    return fs.readFileSync(localKey, 'utf-8').trim();
  }

  // 3. Global key
  if (fs.existsSync(GLOBAL_CONFIG)) {
    try {
      const g = JSON.parse(fs.readFileSync(GLOBAL_CONFIG, 'utf-8'));
      if (g.apiKey) return g.apiKey.trim();
    } catch {
      // ignore
    }
  }

  return null;
}

export function saveApiKey(key: string, root: string = findRoot(), globalOnly: boolean = false): void {
  if (!globalOnly) {
    fs.writeFileSync(path.join(root, KEY_FILE), key.trim(), 'utf-8');
  }

  if (!fs.existsSync(GLOBAL_DIR)) {
    fs.mkdirSync(GLOBAL_DIR, { recursive: true });
  }
  fs.writeFileSync(GLOBAL_CONFIG, JSON.stringify({ apiKey: key.trim(), lastUpdated: new Date().toISOString() }, null, 2));
}
