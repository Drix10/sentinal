#!/usr/bin/env node
import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import { Command } from "commander";
import { attackCommand } from "./commands/attack";
import { setGeminiKeyCommand } from "./commands/set-key";
import { explainCommand } from "./commands/explain";
import { fixCommand } from "./commands/fix";
import { ignoreCommand } from "./commands/ignore";
import { doctorCommand } from "./commands/doctor";
import { checkUpdateNotifier } from "./utils/updateNotifier";

// Handle SIGINT (Ctrl+C) gracefully
process.on("SIGINT", () => {
  console.log("\n\x1b[33m ⚠️ Operation cancelled by user.\x1b[0m\n");
  process.exit(0);
});

// Read version dynamically from package.json
let cliVersion = "1.0.7";
try {
  const pkgPath = path.join(__dirname, "../package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    cliVersion = pkg.version || cliVersion;
  }
} catch {
  // Fallback version
}

const program = new Command();

program
  .name("sentinel")
  .description("Sentinel Platform CLI for security scanning, AI reasoning, and zero-breakage autonomous patching")
  .version(cliVersion);

program
  .command("set-key")
  .description("Configure Gemini API Key")
  .action(async () => {
    await checkUpdateNotifier(cliVersion);
    await setGeminiKeyCommand();
  });

program
  .command("doctor [target]")
  .description("Run system environment and security configuration diagnostic checks")
  .action(async (target?: string) => {
    await checkUpdateNotifier(cliVersion);
    await doctorCommand(target);
  });

program
  .command("attack [target]")
  .description("Analyze repository security topology and synthesize attack graphs")
  .option("-f, --format <format>", "Output format (table, json, sarif)", "table")
  .option("-o, --output <path>", "Output report file path")
  .action(async (target: string | undefined, options: { format?: string; output?: string }) => {
    await checkUpdateNotifier(cliVersion);
    await attackCommand(target, options);
  });

program
  .command("explain <findingId>")
  .description("Display deep OWASP/CWE analysis and source code evidence for a finding")
  .action(async (findingId: string) => {
    await checkUpdateNotifier(cliVersion);
    await explainCommand(findingId);
  });

program
  .command("fix <findingId>")
  .description("Generate and apply autonomous AI remediation patch with zero-breakage verification")
  .option("--dry-run", "Preview AI patch diff without physically modifying disk files")
  .option("--no-verify", "Skip compiler and test runner verification pipeline")
  .action(async (findingId: string, options: { dryRun?: boolean; verify?: boolean }) => {
    await checkUpdateNotifier(cliVersion);
    await fixCommand(findingId, options);
  });

program
  .command("ignore <findingId>")
  .description("Mark a finding as ignored with optional reason")
  .option("-r, --reason <reason>", "Reason for ignoring finding")
  .action(async (findingId: string, options: { reason?: string }) => {
    await checkUpdateNotifier(cliVersion);
    await ignoreCommand(findingId, options.reason);
  });

program.parseAsync(process.argv);
