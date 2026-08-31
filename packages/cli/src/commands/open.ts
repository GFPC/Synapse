import open from 'open';
import chalk from 'chalk';
import { loadConfig } from '../config';

export async function openCommand(nodeIdArg?: string) {
  const cfg = loadConfig();
  const baseUrl = cfg.server || 'http://87.58.204.138';
  
  let targetUrl = baseUrl;
  if (cfg.project) {
    targetUrl = `${baseUrl}/#/project/${cfg.project}`;
  }

  console.log(chalk.cyan(`Opening Synapse in browser: ${targetUrl}`));
  await open(targetUrl);
}
