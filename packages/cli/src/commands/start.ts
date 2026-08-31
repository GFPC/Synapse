import chalk from 'chalk';
import enquirer from 'enquirer';
import { SynapseApi } from '../api';
import { loadConfig } from '../config';
import { Git } from '../git';

export async function startCommand(nodeIdArg?: string) {
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
    const choices = nodes.map((n) => ({
      name: n.id,
      message: `[${n.display_id}] ${n.title} (${n.type}) [${n.status || 'draft'}]`,
    }));

    const prompt = await enquirer.prompt<{ selectedId: string }>({
      type: 'select',
      name: 'selectedId',
      message: 'Choose node to start working on:',
      choices,
    });

    targetNode = nodes.find((n) => n.id === prompt.selectedId);
  }

  if (!targetNode) return;

  const slug = targetNode.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 30);

  const branchName = `feat/${targetNode.display_id}-${slug}`;

  console.log(chalk.cyan(`\nSwitching to node: [${targetNode.display_id}] ${targetNode.title}`));
  
  // Checkout branch
  Git.checkoutBranch(branchName, true);

  // Update status to in_progress in Synapse
  try {
    await api.updateNode(targetNode.id, { status: 'in_progress' });
    console.log(chalk.green(`? Node status updated to ${chalk.bold('in_progress')} in Synapse`));
    console.log(chalk.green(`? Git branch created: ${chalk.bold(branchName)}`));
    console.log(chalk.dim(`Commits in this branch will automatically be tagged with [${targetNode.display_id}].\n`));
  } catch (err: any) {
    console.error(chalk.yellow(`! Branch created, but failed to update status on server: ${err.message}`));
  }
}
