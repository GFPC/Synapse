import chalk from 'chalk';
import enquirer from 'enquirer';
import { SynapseApi } from '../api';
import { loadConfig } from '../config';
import { Git } from '../git';

export async function finishCommand() {
  const cfg = loadConfig();
  if (!cfg.project) {
    console.log(chalk.yellow('Run `synapse init` first!'));
    return;
  }

  const currentBranch = Git.getCurrentBranch();
  const nodeId = Git.getNodeFromBranch(currentBranch);

  if (!nodeId) {
    console.log(chalk.yellow(`Current branch (${currentBranch}) does not match any Synapse node ID.`));
    return;
  }

  const api = new SynapseApi();
  const nodes = await api.listNodes(cfg.project);
  const target = nodes.find((n) => n.display_id === nodeId);

  if (!target) {
    console.log(chalk.red(`Node ${nodeId} not found in Synapse.`));
    return;
  }

  const prompt = await enquirer.prompt<{ status: string }>({
    type: 'select',
    name: 'status',
    message: `Mark [${target.display_id}] ${target.title} as:`,
    choices: [
      { name: 'completed', message: '? Completed (Done & verified)' },
      { name: 'review', message: '? In Review (PR opened)' },
      { name: 'draft', message: '? Draft (Paused)' },
    ],
  });

  try {
    await api.updateNode(target.id, { status: prompt.status });
    console.log(chalk.green(`\n? Marked [${target.display_id}] as ${prompt.status} in Synapse graph!`));

    const promptBack = await enquirer.prompt<{ switchMain: boolean }>({
      type: 'confirm',
      name: 'switchMain',
      message: 'Switch back to main branch?',
      initial: true,
    });

    if (promptBack.switchMain) {
      Git.checkoutBranch('main');
    }
  } catch (err: any) {
    console.error(chalk.red(`? Failed to update node: ${err.message}`));
  }
}
