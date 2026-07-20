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

  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
}

export function getApiKey(): string | undefined {
  if (!fs.existsSync(CONFIG_FILE)) return undefined;

  const config: SentinelConfig = JSON.parse(
    fs.readFileSync(CONFIG_FILE, "utf8"),
  );

  return config.geminiApiKey;
}

export function hasApiKey(): boolean {
  return !!getApiKey();
}
