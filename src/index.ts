import "dotenv/config";
import { Command } from "commander";
import { attackCommand } from "./commands/attack";

const program = new Command();

program
  .name("sentinal")
  .description(
    "CLI tool for scanning repositories and reporting vulnerabilities",
  )
  .version("1.0.0");

program
  .command("attack")
  .description("Analyze a project for security issues")
  .action(async () => {
    await attackCommand();
  });

program.parseAsync(process.argv);