import chalk from 'chalk';
import enquirer from 'enquirer';
import { SynapseApi } from '../api';
import { loadConfig, getActiveNode, setActiveNode } from '../config';
import { Git } from '../git';

export async function startCommand(nodeIdArg?: string, options: { branch?: boolean } = {}) {
  const cfg = loadConfig();
  if (!cfg.project) {
    console.log(chalk.yellow('Run `synapse init` first!'));
    return;
  }

  const api = new SynapseApi();
  const nodes = await api.listNodes(cfg.project);

  let targetNode = nodeIdArg
    ? nodes.find((n) => n.display_id.toUpperCase() === nodeIdArg.toUpperCase() || n.id === nodeIdArg)
    : null;

  if (!targetNode) {
    const currentActiveId = getActiveNode();
    const choices = nodes.map((n) => ({
      name: n.id,
      message: `[${n.display_id}] ${n.title} (${n.type}) [${n.status || 'draft'}]${
        n.display_id === currentActiveId ? ' ? CURRENT' : ''
      }`,
    }));

    const prompt = await enquirer.prompt<{ selectedId: string }>({
      type: 'select',
      name: 'selectedId',
      message: 'Select active architectural node:',
      choices,
    });

    targetNode = nodes.find((n) => n.id === prompt.selectedId);
  }

  if (!targetNode) return;

  // Set active node in .synapse-context without changing git branches
  setActiveNode(targetNode.display_id);

  // Optional: create isolated branch if user explicitly passed --branch
  if (options.branch) {
    const slug = targetNode.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);
    const branchName = `feat/${targetNode.display_id}-${slug}`;
    Git.checkoutBranch(branchName, true);
    console.log(chalk.green(`? Switched to branch: ${chalk.bold(branchName)}`));
  } else {
    const currentBranch = Git.getCurrentBranch();
    console.log(chalk.dim(`Staying on active branch: ${chalk.yellow.bold(currentBranch || 'main')}`));
  }

  // Update status in Synapse
  try {
    await api.updateNode(targetNode.id, { status: 'in_progress' });
    console.log(chalk.cyan(`\n? Active context: ${chalk.cyan.bold(`[${targetNode.display_id}]`)} ${targetNode.title}`));
    console.log(chalk.green(`? Status updated to ${chalk.bold('in_progress')} in Synapse graph`));
    console.log(chalk.dim(`Any commits in this repo will now automatically be tagged with [${targetNode.display_id}].\n`));
  } catch (err: any) {
    console.error(chalk.yellow(`! Active context set, but failed to update status on server: ${err.message}`));
  }
}
