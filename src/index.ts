#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { attackCommand } from "./commands/attack";
import { setGeminiKeyCommand } from "./commands/set-key";
import { explainCommand } from "./commands/explain";
import { fixCommand } from "./commands/fix";
import { ignoreCommand } from "./commands/ignore";

const program = new Command();

program
  .name("sentinel")
  .description("Sentinel Platform CLI for security scanning, AI reasoning, and zero-breakage autonomous patching")
  .version("1.0.6");

program
  .command("set-key")
  .description("Configure Gemini API Key")
  .action(async () => {
    await setGeminiKeyCommand();
  });

program
  .command("attack [target]")
  .description("Analyze repository security topology and synthesize attack graphs")
  .action(async (target?: string) => {
    await attackCommand(target);
  });

program
  .command("explain <findingId>")
  .description("Display deep OWASP/CWE analysis and source code evidence for a finding")
  .action(async (findingId: string) => {
    await explainCommand(findingId);
  });

program
  .command("fix <findingId>")
  .description("Generate and apply autonomous AI remediation patch with zero-breakage verification")
  .option("--dry-run", "Preview AI patch diff without physically modifying disk files")
  .option("--no-verify", "Skip compiler and test runner verification pipeline")
  .action(async (findingId: string, options: { dryRun?: boolean; verify?: boolean }) => {
    await fixCommand(findingId, options);
  });

program
  .command("ignore <findingId>")
  .description("Mark a finding as ignored with optional reason")
  .option("-r, --reason <reason>", "Reason for ignoring finding")
  .action(async (findingId: string, options: { reason?: string }) => {
    await ignoreCommand(findingId, options.reason);
  });

program.parseAsync(process.argv);
