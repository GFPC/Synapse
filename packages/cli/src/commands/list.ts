import chalk from 'chalk';
import Table from 'cli-table3';
import { SynapseApi } from '../api';
import { loadConfig } from '../config';
import { Git } from '../git';

export async function listCommand(options: { type?: string }) {
  const cfg = loadConfig();
  if (!cfg.project) {
    console.log(chalk.yellow('Run `synapse init` first!'));
    return;
  }

  const api = new SynapseApi();
  try {
    let nodes = await api.listNodes(cfg.project);
    if (options.type) {
      nodes = nodes.filter((n) => n.type === options.type);
    }

    const currentBranch = Git.getCurrentBranch();
    const activeNodeId = Git.getNodeFromBranch(currentBranch);

    const table = new Table({
      head: [chalk.cyan('ID'), chalk.cyan('Type'), chalk.cyan('Title'), chalk.cyan('Status')],
      colWidths: [10, 14, 45, 16],
    });

    for (const n of nodes) {
      const isCurrent = n.display_id === activeNodeId;
      const idStr = isCurrent ? chalk.green.bold(`* ${n.display_id}`) : chalk.bold(n.display_id);
      const statusStr =
        n.status === 'completed'
          ? chalk.green('? completed')
          : n.status === 'in_progress'
          ? chalk.yellow('? in_progress')
          : chalk.dim('? draft');

      table.push([idStr, n.type, n.title.length > 40 ? n.title.substring(0, 37) + '...' : n.title, statusStr]);
    }

    console.log(chalk.cyan.bold(`\nArchitecture Nodes (${nodes.length}):\n`));
    console.log(table.toString());
    console.log('');
  } catch (err: any) {
    console.error(chalk.red(`? Failed to list nodes: ${err.message}`));
  }
}
