import path from "node:path";
import fs from "node:fs";
import ora from "ora";
import { hasApiKey } from "../core/config";
import { runAttack } from "../core/orchestrator";
import { colors, renderBanner } from "../ui/render";

export async function attackCommand(target?: string) {
  renderBanner();

  if (!hasApiKey()) {
    console.log(colors.critical(" ✖ Gemini API Key not configured.\n"));
    console.log(colors.medium("   Run:\n\n   sentinel set-key\n"));
    process.exit(1);
  }

  let projectPath: string;

  if (typeof target !== "string" || target === ".") {
    projectPath = process.cwd();
  } else {
    projectPath = path.resolve(target);
  }

  if (!fs.existsSync(projectPath)) {
    console.error(colors.critical(` ✖ Directory not found: ${projectPath}`));
    process.exit(1);
  }

  if (!fs.statSync(projectPath).isDirectory()) {
    console.error(colors.critical(` ✖ Target is not a directory: ${projectPath}`));
    process.exit(1);
  }

  console.log(colors.brand(` Target: ${projectPath}\n`));
  const spinner = ora(colors.brand("Starting attack analysis pipeline...")).start();

  await runAttack(projectPath, spinner);
}
