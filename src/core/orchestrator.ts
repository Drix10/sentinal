import chalk from "chalk";
import type { Ora } from "ora";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runAttack(projectPath: string, spinner: Ora) {
  spinner.text = `Scanning ${projectPath}`;
  await delay(2500);
  spinner.succeed("Project Detected");

  console.log(chalk.cyan(`\nProject Path: ${projectPath}\n`));
}