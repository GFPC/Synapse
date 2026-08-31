import chalk from 'chalk';
import { SynapseApi } from '../api';
import { loadConfig } from '../config';
import { Git } from '../git';

export async function linkCommand(nodeIdArg: string) {
  const cfg = loadConfig();
  if (!cfg.project) {
    console.log(chalk.yellow('Run `synapse init` first!'));
    return;
  }

  if (!nodeIdArg) {
    console.log(chalk.yellow('Usage: synapse link <NODE_ID> (e.g. synapse link C-002)'));
    return;
  }

  const api = new SynapseApi();
  const nodes = await api.listNodes(cfg.project);
  const target = nodes.find(
    (n) => n.display_id.toUpperCase() === nodeIdArg.toUpperCase() || n.id === nodeIdArg
  );

  if (!target) {
    console.log(chalk.red(`Node ${nodeIdArg} not found in current project.`));
    return;
  }

  const currentBranch = Git.getCurrentBranch();
  console.log(chalk.green(`? Linked branch ${chalk.bold(currentBranch)} to [${target.display_id}] ${target.title}`));
  console.log(chalk.dim(`Next commits in this branch will automatically be tagged with [${target.display_id}].`));
}
