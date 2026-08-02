import { GoogleGenerativeAI, type ResponseSchema } from "@google/generative-ai";
import { getApiKey } from "../core/config.js";
import type { Finding } from "../findings/findingStore.js";
import {
  buildSecurityPrompt,
  buildExplainPrompt,
  buildFixPrompt,
  securityReportSchema,
  explainFindingSchema,
  fixPatchSchema,
} from "./prompts.js";

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
  if (!text || typeof text !== "string") throw new Error("Empty or invalid AI model response.");
  let cleaned = text.trim();
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (jsonBlockMatch && jsonBlockMatch[1]) {
    cleaned = jsonBlockMatch[1].trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const firstBrace = cleaned.search(/[\{\[]/);
    const lastBrace = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const jsonSub = cleaned.substring(firstBrace, lastBrace + 1);
      return JSON.parse(jsonSub);
    }
    throw err;
  }
}

const sleepMs = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function isTransientError(err: any): boolean {
  if (!err) return false;
  const name = err.name ? String(err.name).toLowerCase() : "";
  const msg = err.message ? String(err.message).toLowerCase() : "";
  const code = err.code ? String(err.code).toLowerCase() : "";
  const status = err.status || err.statusCode;
  return (
    status === 429 ||
    status === 503 ||
    status === 504 ||
    code === "abort_err" ||
    name === "aborterror" ||
    name === "timeouterror" ||
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("rate limit") ||
    msg.includes("overloaded") ||
    msg.includes("econnreset") ||
    msg.includes("timeout") ||
    msg.includes("aborted")
  );
}

export async function generateWithRetry(model: any, prompt: string, maxRetries = 3): Promise<any> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const result = await model.generateContent(prompt, {
        timeout: REQUEST_TIMEOUT_MS,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
      return parseJsonResponse(result.response.text());
    } catch (err: any) {
      attempt++;
      if (attempt < maxRetries && isTransientError(err)) {
        const backoff = Math.pow(2, attempt) * 1000;
        await sleepMs(backoff);
        continue;
      }
      throw err;
    }
  }
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
    return await generateWithRetry(model, prompt);
  } catch (err) {
    if (isModelUnavailableError(err)) {
      const fallbackModel = client.getGenerativeModel({
        model: fallbackModelName,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema,
        },
      });
      return await generateWithRetry(fallbackModel, prompt);
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
  deepContextText?: string,
): Promise<any> {
  const prompt = buildExplainPrompt(finding, fileContent, deepContextText);
  return invokeStructuredGemini(prompt, explainFindingSchema);
}

export async function generateFixReport(
  finding: Finding,
  fileContent: string,
  deepContextText?: string,
  errorFeedback?: string,
): Promise<any> {
  const prompt = buildFixPrompt(finding, fileContent, deepContextText, errorFeedback);
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
