import chalk from 'chalk';
import { SynapseApi } from '../api';
import { loadConfig, loadApiKey, getActiveNode } from '../config';
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
    const proj = await api.getProject(cfg.project);
    const nodes = await api.listNodes(cfg.project);
    const currentBranch = Git.getCurrentBranch();
    
    // Active node: check .synapse-context first, then branch
    const activeNodeId = getActiveNode() || Git.getNodeFromBranch(currentBranch);
    const activeNode = activeNodeId ? nodes.find((n) => n.display_id === activeNodeId) : null;

    let userName = 'Alex Mercer';
    let userEmail = 'alex@synapse.dev';
    try {
      const me = await api.getMe();
      if (me?.name) {
        userName = me.name;
        userEmail = me.email;
      }
    } catch {
      if (proj.members && proj.members.length > 0) {
        const m = proj.members[proj.members.length - 1];
        if (m.user_name) userName = m.user_name;
        if (m.user_email) userEmail = m.user_email;
      }
    }

    console.log(chalk.cyan.bold(`\n=== Synapse :: ${proj.name || 'Project'} ===\n`));
    console.log(`  ${chalk.dim('Server:')}   ${cfg.server}  ${chalk.green(`[Online: ${pingMs}ms]`)}`);
    console.log(`  ${chalk.dim('User:')}     ${userName} (${userEmail})`);
    console.log(`  ${chalk.dim('Project:')}  ${proj.name} [${nodes.length} nodes]`);
    console.log(`  ${chalk.dim('Branch:')}   ${chalk.yellow.bold(currentBranch || 'N/A')}`);

    if (activeNode) {
      console.log(`  ${chalk.dim('Active:')}   ${chalk.cyan.bold(`[${activeNode.display_id}]`)} ${activeNode.title} (${chalk.green(activeNode.status || 'in_progress')})`);
    } else {
      console.log(`  ${chalk.dim('Active:')}   No active node selected (run ${chalk.bold('syn use')} to select one)`);
    }
    console.log('');
  } catch (err: any) {
    console.error(chalk.red(`[ERR] Failed to get status: ${err.message || err}`));
  }
}
