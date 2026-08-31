import chalk from 'chalk';
import enquirer from 'enquirer';
import { SynapseApi } from '../api';
import { loadConfig, getActiveNode, setActiveNode } from '../config';
import { Git } from '../git';

export async function finishCommand() {
  const cfg = loadConfig();
  if (!cfg.project) {
    console.log(chalk.yellow('Run `synapse init` first!'));
    return;
  }

  const currentBranch = Git.getCurrentBranch();
  const nodeId = getActiveNode() || Git.getNodeFromBranch(currentBranch);

  if (!nodeId) {
    console.log(chalk.yellow('No active Synapse node context found. Run `syn use <ID>` to select one.'));
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
      { name: 'completed', message: '[Done] Completed (Verified & merged)' },
      { name: 'review', message: '[Review] In Review (Ready for PR)' },
      { name: 'draft', message: '[Draft] Draft (Paused)' },
    ],
  });

  try {
    await api.updateNode(target.id, { status: prompt.status });
    console.log(chalk.green(`\n[OK] Marked [${target.display_id}] as ${prompt.status} in Synapse graph!`));
    
    // Clear active context
    setActiveNode(null);
    console.log(chalk.dim('Cleared active node context. Use `syn use <ID>` when ready for the next task.\n'));
  } catch (err: any) {
    console.error(chalk.red(`[ERR] Failed to update node: ${err.message}`));
  }
}
