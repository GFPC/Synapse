import chalk from 'chalk';
import { SynapseApi } from '../api';

export async function ideaCommand(titleArg: string, options: { content?: string } = {}) {
  if (!titleArg) {
    console.log(chalk.yellow('Usage: synapse idea "Your concept or thought"'));
    return;
  }

  const api = new SynapseApi();
  try {
    const idea = await api.createIdea(titleArg, options.content || '');
    console.log(chalk.green(`?? Idea captured in Synapse: "${idea.title}"`));
    console.log(chalk.dim('Visible immediately in mobile & web app.'));
  } catch (err: any) {
    console.error(chalk.red(`? Failed to capture idea: ${err.message}`));
  }
}
