import chalk from 'chalk';
import fs from 'fs';
import { SynapseApi } from '../api';
import { loadConfig } from '../config';
import { Git } from '../git';

export async function benchCommand(options: { node?: string; file?: string }) {
  const cfg = loadConfig();
  if (!cfg.project) {
    console.log(chalk.yellow('Run `synapse init` first!'));
    return;
  }

  const api = new SynapseApi();
  const nodes = await api.listNodes(cfg.project);

  // Find target benchmark node (or auto-detect from branch)
  let targetNodeId = options.node;
  if (!targetNodeId) {
    const currentBranch = Git.getCurrentBranch();
    const branchId = Git.getNodeFromBranch(currentBranch);
    if (branchId) targetNodeId = branchId;
  }

  let targetNode = targetNodeId
    ? nodes.find((n) => n.display_id.toUpperCase() === targetNodeId?.toUpperCase() || n.id === targetNodeId)
    : null;

  if (!targetNode) {
    const benchNodes = nodes.filter((n) => n.type === 'benchmark');
    if (benchNodes.length > 0) {
      targetNode = benchNodes[0];
    } else {
      console.log(chalk.yellow('No benchmark node found. Specify with --node <ID> (e.g. --node B-001)'));
      return;
    }
  }

  // Read input from stdin or file
  let benchOutput = '';
  if (options.file && fs.existsSync(options.file)) {
    benchOutput = fs.readFileSync(options.file, 'utf-8');
  } else if (!process.stdin.isTTY) {
    benchOutput = fs.readFileSync(0, 'utf-8');
  }

  if (!benchOutput.trim()) {
    console.log(chalk.yellow('Usage: go test -bench=. ./... | synapse bench --node B-001'));
    return;
  }

  console.log(chalk.cyan(`\nAttaching benchmark metrics to [${targetNode.display_id}] ${targetNode.title}...`));

  const updatedContent = `${targetNode.content || ''}\n\n### Benchmark Run (${new Date().toLocaleString()})\n\`\`\`\n${benchOutput.trim()}\n\`\`\``;

  try {
    await api.updateNode(targetNode.id, { content: updatedContent, status: 'completed' });
    console.log(chalk.green(`? Benchmark metrics successfully attached to [${targetNode.display_id}]!`));
    console.log(chalk.dim(`View live on ?????? Synapse at ${cfg.server}/#/project/${cfg.project}\n`));
  } catch (err: any) {
    console.error(chalk.red(`? Failed to attach benchmark: ${err.message}`));
  }
}
