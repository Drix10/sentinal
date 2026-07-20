import { GoogleGenerativeAI } from "@google/generative-ai";
import { getApiKey } from "../core/config";
import { ProjectAnalysis } from "../types";

export async function generateSecurityReport(analysis: ProjectAnalysis) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Gemini API Key missing.");

  const client = new GoogleGenerativeAI(apiKey);

  const model = client.getGenerativeModel({ model: "gemini-3.5-flash" });

  const prompt = `cyber secuity report on the codebase\n${JSON.stringify(analysis, null, 2)}`;

  const result = await model.generateContent(prompt);

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
