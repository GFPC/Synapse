#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import { initCommand } from './commands/init';
import { statusCommand } from './commands/status';
import { listCommand } from './commands/list';
import { showCommand } from './commands/show';
import { startCommand } from './commands/start';
import { finishCommand } from './commands/finish';
import { dropCommand, dropsCommand } from './commands/drop';
import { ideaCommand } from './commands/idea';
import { openCommand } from './commands/open';

const program = new Command();

program
  .name('synapse')
  .description('Synapse Developer CLI ? bridge architectural theory and live code')
  .version('1.0.0');

program
  .command('init')
  .description('Initialize Synapse in current repository & install Git hooks')
  .option('-s, --server <url>', 'Synapse API server URL')
  .option('-k, --key <key>', 'Personal API Key or Token')
  .action(initCommand);

program
  .command('status')
  .description('View current project, active branch, and linked architecture node')
  .action(statusCommand);

program
  .command('ls')
  .alias('list')
  .description('List all architecture nodes in current project')
  .option('-t, --type <type>', 'Filter by node type (component, decision, feature, benchmark)')
  .action(listCommand);

program
  .command('show <id>')
  .description('Show full details and relations for a specific node ID (e.g. C-002)')
  .action(showCommand);

program
  .command('start [id]')
  .alias('switch')
  .description('Start working on a node (interactive selector + auto-create git branch)')
  .action(startCommand);

program
  .command('finish')
  .description('Finish working on current node & update status in Synapse graph')
  .action(finishCommand);

program
  .command('drop [text]')
  .description('Drop snippet, text, or file stream to mobile & PC clipboard')
  .option('-t, --type <type>', 'Content type: text | code | link', 'text')
  .option('-f, --file <file>', 'Upload file content')
  .action(dropCommand);

program
  .command('drops')
  .description('View recent Quick Drops')
  .option('-l, --limit <n>', 'Number of drops', '10')
  .action((opts) => dropsCommand(parseInt(opts.limit, 10)));

program
  .command('idea <text>')
  .description('Capture an idea or architectural note from terminal')
  .option('-c, --content <content>', 'Detailed body text')
  .action(ideaCommand);

program
  .command('open [id]')
  .description('Open active project or specific node in web browser')
  .action(openCommand);

program.parse(process.argv);

if (!process.argv.slice(2).length) {
  statusCommand();
}
