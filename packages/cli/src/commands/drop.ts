import chalk from 'chalk';
import fs from 'fs';
import { SynapseApi } from '../api';

export async function dropCommand(textArg?: string, options: { type?: 'text' | 'code' | 'link'; file?: string } = {}) {
  let content = textArg || '';

  if (options.file && fs.existsSync(options.file)) {
    content = fs.readFileSync(options.file, 'utf-8');
  } else if (!content && !process.stdin.isTTY) {
    content = fs.readFileSync(0, 'utf-8');
  }

  if (!content.trim()) {
    console.log(chalk.yellow('Usage: synapse drop "Text to drop" OR cat file.txt | synapse drop'));
    return;
  }

  let dropType = options.type || 'text';
  if (content.startsWith('http://') || content.startsWith('https://')) {
    dropType = 'link';
  } else if (content.includes('{') || content.includes('function') || content.includes('const ')) {
    dropType = 'code';
  }

  const api = new SynapseApi();
  try {
    const item = await api.createQuickDrop(content.trim(), dropType);
    console.log(chalk.green(`[OK] Quick drop sent to mobile & web mesh! (${dropType})`));
    console.log(chalk.dim(`ID: ${item.id} | Preview: ${content.trim().substring(0, 50)}...\n`));
  } catch (err: any) {
    console.error(chalk.red(`[ERR] Failed to drop: ${err.message}`));
  }
}

export async function dropsCommand(limit: number = 10) {
  const api = new SynapseApi();
  try {
    const items = await api.listQuickDrops();
    const slice = items.slice(0, limit);

    console.log(chalk.cyan.bold(`\nRecent Quick Drops (${slice.length}):\n`));
    slice.forEach((item) => {
      const time = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      console.log(`  ${chalk.dim(time)} ${chalk.cyan(`[${item.type.toUpperCase()}]`)} ${item.content.replace(/\n/g, ' ').substring(0, 70)}`);
    });
    console.log('');
  } catch (err: any) {
    console.error(chalk.red(`[ERR] Failed to list drops: ${err.message}`));
  }
}
