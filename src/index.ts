import "dotenv/config";
import { Command } from "commander";
import { attackCommand } from "./commands/attack";
import { setGeminiKeyCommand } from "./commands/config";

const program = new Command();

program
  .name("sentinel")
  .description(
    "CLI tool for scanning repositories and reporting vulnerabilities",
  )
  .version("1.0.0");

program
  .command("config")
  .description("Configure Sentinel")
  .command("set-key")
  .description("SetGemini API Key")
  .action(async () => {
    await setGeminiKeyCommand();
  });
program
  .command("attack")
  .description("Analyze a project for security issues")
  .action(async (target?: string) => {
    const project = typeof target === "string" ? target : undefined;
    await attackCommand(target);
  });

program.parseAsync(process.argv);
