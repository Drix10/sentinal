import { GoogleGenerativeAI } from "@google/generative-ai";
import { getApiKey } from "../core/config";
import type { ProjectAnalysis } from "../types";
import { buildSecurityPrompt } from "./prompts";
import chalk from "chalk";

function isModelUnavailableError(err: any): boolean {
  const msg = String(err?.message || "").toLowerCase();
  const status = err?.status || err?.statusCode;
  return (
    status === 404 ||
    msg.includes("not found") ||
    msg.includes("not_found") ||
    msg.includes("is not supported") ||
    msg.includes("unsupported model")
  );
}

export async function generateSecurityReport(analysis: ProjectAnalysis) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Gemini API Key missing.");

  const client = new GoogleGenerativeAI(apiKey);
  const primaryModel = "gemini-2.5-flash";

  try {
    const model = client.getGenerativeModel({ model: primaryModel });
    const result = await model.generateContent(buildSecurityPrompt(analysis));
    let report = result.response.text();

    return formatReportColors(report);
  } catch (err) {
    if (isModelUnavailableError(err)) {
      const fallbackModel = client.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await fallbackModel.generateContent(buildSecurityPrompt(analysis));
      let report = result.response.text();

      return formatReportColors(report);
    }
    throw err;
  }
}

function formatReportColors(report: string): string {
  return report
    .replace(/\[CRITICAL\]/g, chalk.red.bold("🔴 CRITICAL"))
    .replace(/\[HIGH\]/g, chalk.hex("#ff8800").bold("🟠 HIGH"))
    .replace(/\[MEDIUM\]/g, chalk.yellow.bold("🟡 MEDIUM"))
    .replace(/\[LOW\]/g, chalk.green.bold("🟢 LOW"))
    .replace(/\[INFO\]/g, chalk.cyan.bold("🔵 INFO"));
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    await model.generateContent("Reply with Ok.");
    return true;
  } catch (err) {
    if (isModelUnavailableError(err)) {
      try {
        const client = new GoogleGenerativeAI(apiKey);
        const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
        await model.generateContent("Reply with Ok.");
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
