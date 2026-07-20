import chalk from "chalk";
import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { saveApiKey } from "../core/config";
import { validateApiKey } from "../ai/llm";

export async function setGeminiKeyCommand() {
  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  console.clear();

  console.log(chalk.red.bold("SENTINEL"));
  console.log(chalk.gray("Gemini Configuration\n"));

  const apiKey = await rl.question("Enter Gemini API Key: ");

  rl.close();

  console.log();

  process.stdout.write("Validating key... ");

  const valid = await validateApiKey(apiKey);

  if (!valid) {
    console.log(chalk.red("FAILED"));

    console.log(chalk.red("\nInvalid Gemini API Key"));

    process.exit(1);
  }

  console.log(chalk.green("OK"));

  saveApiKey(apiKey);

  console.log(chalk.green("\nGemini API Key saved successfully."));
}
