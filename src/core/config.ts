import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CONFIG_DIR = path.join(os.homedir(), ".sentinel");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface SentinelConfig {
  geminiApiKey?: string;
}

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function saveApiKey(apiKey: string) {
  ensureConfigDir();
  const config: SentinelConfig = { geminiApiKey: apiKey };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
  try {
    fs.chmodSync(CONFIG_FILE, 0o600);
  } catch {
  }
}

export function getApiKey(): string | undefined {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;

  if (!fs.existsSync(CONFIG_FILE)) return undefined;

  try {
    const config: SentinelConfig = JSON.parse(
      fs.readFileSync(CONFIG_FILE, "utf8"),
    );
    return config.geminiApiKey;
  } catch {
    return undefined;
  }
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}
