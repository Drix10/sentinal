#!/usr/bin/env node
import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { Command } from "commander";
import { attackCommand } from "./commands/attack.js";
import { setGeminiKeyCommand } from "./commands/set-key.js";
import { explainCommand } from "./commands/explain.js";
import { fixCommand } from "./commands/fix.js";
import { ignoreCommand } from "./commands/ignore.js";
import { doctorCommand } from "./commands/doctor.js";
import { checkUpdateNotifier } from "./utils/updateNotifier.js";
import { colors } from "./ui/render.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.on("SIGINT", () => {
  console.log("\n\x1b[33m ⚠️ Operation cancelled by user.\x1b[0m\n");
  process.exit(0);
});

let cliVersion = "1.0.8";
try {
  const pkgPath = path.join(__dirname, "../package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    cliVersion = pkg.version || cliVersion;
  }
} catch {
}

const program = new Command();

program
  .name("sentinel")
  .description("Sentinel CLI for security scanning, AI reasoning, and zero-breakage autonomous patching")
  .version(cliVersion)
  .option("-q, --quiet", "Suppress non-essential console output")
  .option("-v, --verbose", "Enable verbose debug output")
  .option("--no-banner", "Suppress ASCII banner")
  .hook("preAction", async () => {
    await checkUpdateNotifier(cliVersion);
  });

async function handleCliAction(actionFn: () => Promise<void>) {
  try {
    await actionFn();
  } catch (err: any) {
    console.error("\n" + colors.critical(` ✖ Execution Error: ${err?.message || err}`));
    if (process.env.DEBUG || process.argv.includes("--verbose") || process.argv.includes("-v")) {
      console.error(colors.gray(err?.stack || ""));
    }
    process.exit(1);
  }
}

program
  .command("set-key")
  .description("Configure Gemini API Key")
  .action(async () => {
    await handleCliAction(async () => {
      await setGeminiKeyCommand();
    });
  });

program
  .command("doctor [target]")
  .description("Run system environment and security configuration diagnostic checks")
  .action(async (target?: string) => {
    await handleCliAction(async () => {
      await doctorCommand(target);
    });
  });

program
  .command("attack [target]")
  .description("Analyze repository security topology and synthesize attack graphs")
  .option("-f, --format <format>", "Output format (table, json, sarif)", "table")
  .option("-o, --output <path>", "Output report file path")
  .action(async (target: string | undefined, options: { format?: string; output?: string }) => {
    await handleCliAction(async () => {
      await attackCommand(target, options);
    });
  });

program
  .command("explain <findingId>")
  .description("Display deep OWASP/CWE analysis and source code evidence for a finding")
  .action(async (findingId: string) => {
    await handleCliAction(async () => {
      await explainCommand(findingId);
    });
  });

program
  .command("fix <findingId>")
  .description("Generate and apply autonomous AI remediation patch with zero-breakage verification")
  .option("--dry-run", "Preview AI patch diff without physically modifying disk files")
  .option("--no-verify", "Skip compiler and test runner verification pipeline")
  .action(async (findingId: string, options: { dryRun?: boolean; verify?: boolean }) => {
    await handleCliAction(async () => {
      await fixCommand(findingId, options);
    });
  });

program
  .command("ignore <findingId>")
  .description("Mark a finding as ignored with optional reason")
  .option("-r, --reason <reason>", "Reason for ignoring finding")
  .action(async (findingId: string, options: { reason?: string }) => {
    await handleCliAction(async () => {
      await ignoreCommand(findingId, options.reason);
    });
  });

program.parseAsync(process.argv);
