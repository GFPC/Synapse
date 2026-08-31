import chalk from 'chalk';
import { SynapseApi } from '../api';
import { loadConfig, loadApiKey } from '../config';
import { Git } from '../git';

export async function statusCommand() {
  const cfg = loadConfig();
  const key = loadApiKey();

  if (!cfg.project || !key) {
    console.log(chalk.yellow('Synapse is not initialized in this repository. Run `synapse init` first!'));
    return;
  }

  const api = new SynapseApi(cfg.server, key);

  try {
    const pingMs = await api.ping();
    const me = await api.getMe();
    const proj = await api.getProject(cfg.project);
    const nodes = await api.listNodes(cfg.project);
    const currentBranch = Git.getCurrentBranch();
    const activeNodeId = Git.getNodeFromBranch(currentBranch);
    const activeNode = activeNodeId ? nodes.find((n) => n.display_id === activeNodeId) : null;

    console.log(chalk.cyan.bold(`\n? Synapse ? ${proj.name || 'Project'}\n`));
    console.log(`  ${chalk.dim('Server:')}   ${cfg.server}  ${chalk.green(`? Online (${pingMs}ms)`)}`);
    console.log(`  ${chalk.dim('User:')}     ${me.name} (${me.email})`);
    console.log(`  ${chalk.dim('Project:')}  ${proj.name} [${nodes.length} nodes]`);
    console.log(`  ${chalk.dim('Branch:')}   ${chalk.yellow.bold(currentBranch || 'N/A')}`);

    if (activeNode) {
      console.log(`  ${chalk.dim('Active:')}   ${chalk.cyan.bold(`[${activeNode.display_id}]`)} ${activeNode.title} (${chalk.green(activeNode.status || 'in_progress')})`);
    } else {
      console.log(`  ${chalk.dim('Active:')}   No active node detected on this branch (run ${chalk.bold('synapse start')} to pick one)`);
    }
    console.log('');
  } catch (err: any) {
    console.error(chalk.red(`? Failed to get status: ${err.message || err}`));
  }
}
