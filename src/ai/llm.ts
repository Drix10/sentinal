import { GoogleGenerativeAI } from "@google/generative-ai";
import { getApiKey } from "../core/config";
import { ProjectAnalysis } from "../types";
import { prompt } from "./prompts";

export async function generateSecurityReport(analysis: ProjectAnalysis) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Gemini API Key missing.");

  const client = new GoogleGenerativeAI(apiKey);

  const model = client.getGenerativeModel({ model: "gemini-3.5-flash" });

  const finalprompt = `${prompt}\n${JSON.stringify(analysis, null, 2)}`;

  const result = await model.generateContent(finalprompt);

  return result.response.text();
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
