import chalk from 'chalk';
import { SynapseApi } from '../api';

export async function ideaCommand(titleArg: string, options: { content?: string } = {}) {
  if (!titleArg) {
    console.log(chalk.yellow('Usage: synapse idea "Idea title" [-c "Body text"]'));
    return;
  }

  const api = new SynapseApi();
  try {
    const idea = await api.createIdea(titleArg, options.content || '');
    console.log(chalk.green(`[OK] Architectural idea recorded in Synapse Brain!`));
    console.log(chalk.dim(`ID: ${idea.id} | Title: ${idea.title}\n`));
  } catch (err: any) {
    console.error(chalk.red(`[ERR] Failed to record idea: ${err.message}`));
  }
}
