import chalk from 'chalk';
import fs from 'fs';
import { SynapseApi } from '../api';

export async function dropCommand(textArg?: string, options: { type?: string; file?: string } = {}) {
  const api = new SynapseApi();
  let content = textArg || '';
  let dropType = options.type || 'text';

  if (options.file && fs.existsSync(options.file)) {
    content = fs.readFileSync(options.file, 'utf-8');
    dropType = 'code';
  } else if (!content && !process.stdin.isTTY) {
    // Read from pipe stdin (e.g. cat file | synapse drop)
    content = fs.readFileSync(0, 'utf-8');
    if (content.length > 50 && (content.includes('{') || content.includes('('))) {
      dropType = 'code';
    }
  }

  if (!content.trim()) {
    console.log(chalk.yellow('Usage: synapse drop "your text" OR cat error.log | synapse drop'));
    return;
  }

  try {
    await api.createQuickDrop(dropType, content.trim());
    console.log(chalk.green(`? Quick Drop synced to phone and PC! (${content.length} chars)`));
  } catch (err: any) {
    console.error(chalk.red(`? Failed to drop: ${err.message}`));
  }
}

export async function dropsCommand(limitArg: number = 10) {
  const api = new SynapseApi();
  try {
    const drops = await api.listQuickDrops();
    console.log(chalk.cyan.bold(`\nRecent Quick Drops (${drops.length}):\n`));
    for (const d of drops.slice(0, limitArg)) {
      const time = new Date(d.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const tag = chalk.bold(`[${d.type.toUpperCase()}]`);
      const body = d.content.length > 80 ? d.content.substring(0, 77) + '...' : d.content;
      console.log(`  ${chalk.dim(time)} ${tag} ${body}`);
    }
    console.log('');
  } catch (err: any) {
    console.error(chalk.red(`? Failed to list drops: ${err.message}`));
  }
}
