import chalk from 'chalk';
import enquirer from 'enquirer';
import { SynapseApi } from '../api';
import { saveConfig, saveApiKey, findRoot } from '../config';
import { Git } from '../git';

export async function initCommand(options: { server?: string; key?: string }) {
  console.log(chalk.cyan.bold('\n? Initializing Synapse in current repository...\n'));

  const root = findRoot();
  const server = options.server || 'http://87.58.204.138';

  let apiKey = options.key;
  if (!apiKey) {
    const prompt1 = await enquirer.prompt<{ apiKey: string }>({
      type: 'input',
      name: 'apiKey',
      message: 'Enter your Synapse API Key (syn_live_...) or User JWT Token:',
      initial: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNTNhYmQ1NzMtZmVlMi00MmZmLWFlZTUtNDBjYmM2N2VkYmUzIiwiZW1haWwiOiJhbGV4QHN5bmFwc2UuZGV2IiwidHlwZSI6ImFjY2VzcyIsImV4cCI6MTc4ODE2NDQ0MSwiaWF0IjoxNzg4MTYzNTQxfQ.w3IvKgjQioWS9qa2Ahyb8jhfjQqNb3eRwkg5J1Lmelw',
    });
    apiKey = prompt1.apiKey.trim();
  }

  const api = new SynapseApi(server, apiKey);

  try {
    const me = await api.getMe();
    console.log(chalk.green(`? Authenticated as ${chalk.bold(me.name)} (${me.email})`));

    // Fetch projects
    const projects = await api.listProjects();
    if (projects.length === 0) {
      console.log(chalk.yellow('No projects found in Synapse. Create one on web/phone first!'));
      return;
    }

    const projectChoices = projects.map((p) => ({
      name: p.id,
      message: `${p.name} (${p.status})`,
    }));

    const prompt2 = await enquirer.prompt<{ projectId: string }>({
      type: 'select',
      name: 'projectId',
      message: 'Select the active project to link with this repo:',
      choices: projectChoices,
    });

    const selectedProj = projects.find((p) => p.id === prompt2.projectId);

    // Save config & keys
    saveConfig(
      {
        server,
        project: selectedProj?.id,
        projectName: selectedProj?.name,
        github: {
          repo: Git.getRepoSlug() || undefined,
        },
        hooks: {
          prepareCommitMsg: true,
          postCommit: true,
        },
      },
      root
    );

    saveApiKey(apiKey!, root);
    console.log(chalk.green('? Saved .synapse.yml and .synapse-key'));

    // Install git hooks
    if (Git.isGitRepo(root)) {
      const hooks = Git.installHooks(root);
      if (hooks.prepare) {
        console.log(chalk.green('? Installed Git prepare-commit-msg hook (auto-tags [C-002] from branch)'));
      }
      console.log(chalk.green('? Added .synapse-key to .gitignore'));
    }

    console.log(chalk.cyan.bold(`\n?? Synapse successfully configured for project: ${selectedProj?.name}!\n`));
    console.log(`Try running:`);
    console.log(`  ${chalk.bold('synapse status')}   ? View project & current branch context`);
    console.log(`  ${chalk.bold('synapse start')}    ? Pick an architectural node and create branch`);
    console.log(`  ${chalk.bold('synapse ls')}       ? List all nodes in this project\n`);
  } catch (err: any) {
    console.error(chalk.red(`? Failed to authenticate: ${err.message || err}`));
  }
}
