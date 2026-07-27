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
  .description("Sentinel Platform CLI for security scanning, AI reasoning, and patch generation")
  .version("1.0.3");

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
  .description("Generate autonomous AI remediation patch for a finding")
  .action(async (findingId: string) => {
    await fixCommand(findingId);
  });

program
  .command("ignore <findingId>")
  .description("Mark a finding as ignored with optional reason")
  .option("-r, --reason <reason>", "Reason for ignoring finding")
  .action(async (findingId: string, options: { reason?: string }) => {
    await ignoreCommand(findingId, options.reason);
  });

program.parseAsync(process.argv);
