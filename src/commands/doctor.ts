import os from "node:os";
import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { getApiKey } from "../core/config.js";
import { colors, renderBanner } from "../ui/render.js";
import { animateBanner } from "../ui/animation.js";

export async function doctorCommand(target?: string) {
  await animateBanner();
  console.log(chalk.bold.cyan(" 🩺 SENTINEL SYSTEM & ENVIRONMENT DIAGNOSTIC\n"));

  const checks: Array<{ name: string; status: "PASS" | "WARN" | "FAIL"; details: string }> = [];

  const nodeVer = process.version;
  const major = parseInt(nodeVer.replace(/^v/, "").split(".")[0], 10);
  if (major >= 18) {
    checks.push({ name: "Node.js Environment", status: "PASS", details: `${nodeVer} (Supported >= 18.x)` });
  } else {
    checks.push({ name: "Node.js Environment", status: "FAIL", details: `${nodeVer} (Requires >= 18.x)` });
  }

  const apiKey = getApiKey();
  if (apiKey) {
    const masked = apiKey.length > 8 ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : "Configured";
    checks.push({ name: "Gemini API Key", status: "PASS", details: `Active key: ${masked}` });
  } else {
    checks.push({ name: "Gemini API Key", status: "FAIL", details: "Not configured. Run 'sentinel set-key' or set GEMINI_API_KEY env" });
  }

  const cwd = target ? path.resolve(target) : process.cwd();
  const pkgPath = path.join(cwd, "package.json");
  if (fs.existsSync(pkgPath)) {
    checks.push({ name: "Target Codebase Manifest", status: "PASS", details: `package.json found in ${cwd}` });
  } else {
    checks.push({ name: "Target Codebase Manifest", status: "WARN", details: `No package.json in ${cwd}. Scan with 'sentinel attack <path>'` });
  }

  const tsconfigPath = path.join(cwd, "tsconfig.json");
  if (fs.existsSync(tsconfigPath)) {
    checks.push({ name: "TypeScript Compiler Config", status: "PASS", details: "tsconfig.json present" });
  } else {
    checks.push({ name: "TypeScript Compiler Config", status: "WARN", details: "No tsconfig.json found (using default fallback parser)" });
  }

  checks.push({ name: "Host OS Environment", status: "PASS", details: `${os.type()} ${os.release()} (${os.arch()})` });
  console.log(chalk.gray("┌───────────────────────────────┬─────────┬────────────────────────────────────────────────────────┐"));
  console.log(chalk.gray("│ DIAGNOSTIC CHECK              │ STATUS  │ DETAILS                                                │"));
  console.log(chalk.gray("├───────────────────────────────┼─────────┼────────────────────────────────────────────────────────┤"));

  let failCount = 0;
  for (const c of checks) {
    const badge = c.status === "PASS" ? chalk.green.bold(" PASS  ") : c.status === "WARN" ? chalk.yellow.bold(" WARN  ") : chalk.red.bold(" FAIL  ");
    if (c.status === "FAIL") failCount++;
    console.log(`│ ${c.name.padEnd(29)} │ ${badge} │ ${c.details.padEnd(54).slice(0, 54)} │`);
  }
  console.log(chalk.gray("└───────────────────────────────┴─────────┴────────────────────────────────────────────────────────┘\n"));

  if (failCount === 0) {
    console.log(colors.low(" ✔ All diagnostic checks passed cleanly! Sentinel is fully operational.\n"));
  } else {
    process.exitCode = 1;
    console.log(colors.critical(` ✖ Found ${failCount} critical diagnostic issue(s). Resolve issues before scanning.\n`));
  }
}
