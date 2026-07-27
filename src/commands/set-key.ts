import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { saveApiKey } from "../core/config";
import { validateApiKey } from "../ai/llm";
import { colors, renderBanner } from "../ui/render";

export async function setGeminiKeyCommand() {
  renderBanner();
  console.log(colors.purple(" 🔑 Gemini API Key Configuration\n"));

  const rl = readline.createInterface({
    input: stdin,
    output: stdout,
  });

  const apiKey = await rl.question(colors.brand(" Enter Gemini API Key: "));
  rl.close();

  console.log();
  process.stdout.write(colors.dim(" Validating key... "));

  const valid = await validateApiKey(apiKey);

  if (!valid) {
    console.log(colors.critical("FAILED"));
    console.log(colors.critical("\n ✖ Invalid Gemini API Key provided.\n"));
    process.exit(1);
  }

  console.log(colors.low("OK"));
  saveApiKey(apiKey);
  console.log(colors.low("\n ✔ Gemini API Key saved successfully to ~/.sentinel/config.json\n"));
}
