import chalk from "chalk";
import ora from "ora";
import path from "node:path";
import fs from "node:fs";
import { hasApiKey } from "../core/config";
import { runAttack } from "../core/orchestrator";

export async function attackCommand(target?: string) {
  console.clear();
  console.log(chalk.red.bold(`SENTINEL`));

  console.log(chalk.grey("AI Secuirty Review Agent\n"));

  if (!hasApiKey()) {
    console.log(chalk.red("Gemini API Key not configured.\n"));
    console.log(chalk.yellow("Run:\n\nsentinel config set-key\n"));
    process.exit(1);
  }

  let projectPath: string;

  if (typeof target !== "string" || target === ".") {
    projectPath = process.cwd();
  } else {
    projectPath = path.resolve(target);
  }

  if (!fs.existsSync(projectPath)) {
    console.error(chalk.red(`Directory not found: ${projectPath}`));
    process.exit(1);
  }

  if (!fs.statSync(projectPath).isDirectory) {
    console.error(chalk.red(`Target is not a directory`));
    process.exit(1);
  }

  console.log(chalk.cyan(`Target: ${projectPath}\n`));
  const spinner = ora("Starting attack analysis...").start();

  await runAttack(projectPath, spinner);
}
