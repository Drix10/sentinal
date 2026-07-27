import { GoogleGenerativeAI, type ResponseSchema } from "@google/generative-ai";
import { getApiKey } from "../core/config";
import type { Finding } from "../findings/findingStore";
import {
  buildSecurityPrompt,
  buildExplainPrompt,
  buildFixPrompt,
  securityReportSchema,
  explainFindingSchema,
  fixPatchSchema,
} from "./prompts";

const REQUEST_TIMEOUT_MS = 60000;

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

function parseJsonResponse(text: string): any {
  const cleaned = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

async function invokeStructuredGemini(
  prompt: string,
  responseSchema: ResponseSchema,
): Promise<any> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Gemini API Key missing.");

  const client = new GoogleGenerativeAI(apiKey);
  const primaryModelName = "gemini-2.5-flash";
  const fallbackModelName = "gemini-2.0-flash";

  try {
    const model = client.getGenerativeModel({
      model: primaryModelName,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });
    const result = await model.generateContent(prompt, {
      timeout: REQUEST_TIMEOUT_MS,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return parseJsonResponse(result.response.text());
  } catch (err) {
    if (isModelUnavailableError(err)) {
      const fallbackModel = client.getGenerativeModel({
        model: fallbackModelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
        },
      });
      const result = await fallbackModel.generateContent(prompt, {
        timeout: REQUEST_TIMEOUT_MS,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      return parseJsonResponse(result.response.text());
    }
    throw err;
  }
}

export async function generateSecurityReport(analysis: any): Promise<any> {
  const prompt = buildSecurityPrompt(analysis);
  return invokeStructuredGemini(prompt, securityReportSchema);
}

export async function generateExplainReport(
  finding: Finding,
  fileContent: string,
): Promise<any> {
  const prompt = buildExplainPrompt(finding, fileContent);
  return invokeStructuredGemini(prompt, explainFindingSchema);
}

export async function generateFixReport(
  finding: Finding,
  fileContent: string,
): Promise<any> {
  const prompt = buildFixPrompt(finding, fileContent);
  return invokeStructuredGemini(prompt, fixPatchSchema);
}

export async function validateApiKey(apiKey: string): Promise<boolean> {
  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    await model.generateContent("Reply with Ok.", {
      timeout: 10000,
      signal: AbortSignal.timeout(10000),
    });
    return true;
  } catch (err) {
    if (isModelUnavailableError(err)) {
      try {
        const client = new GoogleGenerativeAI(apiKey);
        const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });
        await model.generateContent("Reply with Ok.", {
          timeout: 10000,
          signal: AbortSignal.timeout(10000),
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}
