import { GoogleGenerativeAI } from "@google/generative-ai";
import { getApiKey } from "../core/config";
import { ProjectAnalysis } from "../types";
import { buildSecurityPrompt } from "./prompts";
import chalk from "chalk";

export async function generateSecurityReport(analysis: ProjectAnalysis) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Gemini API Key missing.");

  const client = new GoogleGenerativeAI(apiKey);

  const model = client.getGenerativeModel({ model: "gemini-3.5-flash" });

  let result = await model.generateContent(buildSecurityPrompt(analysis));

  let report = result.response.text();

  report = report
    .replace(/\[CRITICAL\]/g, chalk.red.bold("🔴 CRITICAL"))
    .replace(/\[HIGH\]/g, chalk.hex("#ff8800").bold("🟠 HIGH"))
    .replace(/\[MEDIUM\]/g, chalk.yellow.bold("🟡 MEDIUM"))
    .replace(/\[LOW\]/g, chalk.green.bold("🟢 LOW"))
    .replace(/\[INFO\]/g, chalk.cyan.bold("🔵 INFO"));

  return report;
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const client = new GoogleGenerativeAI(apiKey);

    const model = client.getGenerativeModel({ model: "gemini-3.5-flash" });

    await model.generateContent("Reply with Ok.");

    return true;
  } catch {
    return false;
  }
}
