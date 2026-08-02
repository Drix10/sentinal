import path from "node:path";
import fs from "node:fs";
import ora from "ora";
import { hasApiKey } from "../core/config.js";
import { runAttack } from "../core/orchestrator.js";
import { colors, renderBanner } from "../ui/render.js";
import { animateBanner } from "../ui/animation.js";

export async function attackCommand(target?: string, options?: { format?: string; output?: string }) {
  await animateBanner();

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

  try {
    await runAttack(projectPath, spinner, options);
  } catch (err) {
    spinner.fail(colors.critical("Attack analysis pipeline encountered an error."));
    throw err;
  }
}
