import chalk from "chalk";
import type { Ora } from "ora";
import { scanProject } from "../scanners/project";
import { scanRoutes } from "../scanners/routes";
import { scanDependencies } from "../scanners/dependencies";
import { scanSecrets } from "../scanners/secrets";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runAttack(projectPath: string, spinner: Ora) {
  spinner.text = `Scanning ${projectPath}`;
  const project = await scanProject(projectPath);
  spinner.succeed("Project Detected");
  console.log();
  console.table(project);

  spinner.start("Discovering routes...");
  const routes = await scanRoutes(projectPath);
  spinner.succeed(`Discovered ${routes.length} routes`);
  console.table(routes.slice(0, 10)); //to keep console clean show 10 only

  spinner.start("Scanning dependencies...");
  const dependencies = await scanDependencies(projectPath);
  spinner.succeed(`Found ${dependencies.length} dependencies`);
  console.table(dependencies.slice(0, 15)); //again to keep console clean

  spinner.start("Scanning dependencies...");
  const secrets = await scanSecrets(projectPath);
  spinner.succeed(`Found ${secrets.length} potential secrets`);
  console.table(secrets.slice(0, 15)); //again to keep console clean
}
