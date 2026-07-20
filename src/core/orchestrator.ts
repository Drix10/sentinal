import chalk from "chalk";
import type { Ora } from "ora";
import { scanProject } from "../scanners/project";
import { scanRoutes } from "../scanners/routes";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runAttack(projectPath: string, spinner: Ora) {
  spinner.text = `Scanning ${projectPath}`;
  const project = await scanProject(projectPath);
  spinner.succeed("Project Detected");
  console.log();
  console.table(project);
  console.log(chalk.cyan(`\nProject Path: ${projectPath}\n`));

  spinner.start("Discovering routes...");

  const routes = await scanRoutes(projectPath);
  spinner.succeed(`Discovered ${routes.length} routes`);
  console.table(routes.slice(0, 10)); //to keep console clean show 10 only
}
