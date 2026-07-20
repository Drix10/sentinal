import chalk from "chalk";
import type { Ora } from "ora";
import { scanProject } from "../scanners/project";

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
}