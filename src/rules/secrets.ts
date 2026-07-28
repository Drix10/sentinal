import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import type { SecretFinding } from "../types";
import { normalizePath } from "../utils/path";

function maskSecret(value: string): string {
  if (!value || value.length <= 8) return "********";
  const start = value.slice(0, 4);
  const end = value.slice(-4);
  return `${start}****${end}`;
}

const PATTERNS = [
  {
    type: "Google API Key",
    regex: /\b(AIzaSy[A-Za-z0-9_-]{33})\b/g,
  },
  {
    type: "OpenAI API Key",
    regex: /\b(sk-proj-[a-zA-Z0-9_-]{32,}|sk-[a-zA-Z0-9]{32,})\b/g,
  },
  {
    type: "AWS Access Key",
    regex: /\b(AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16}\b/g,
  },
  {
    type: "GitHub Token",
    regex: /\b(ghp_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59})\b/g,
  },
  {
    type: "Stripe API Key",
    regex: /\b(sk_live_[0-9a-zA-Z]{24,}|rk_live_[0-9a-zA-Z]{24,})\b/g,
  },
  {
    type: "Private Key",
    regex: /-----BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY-----/g,
  },
  {
    type: "Database Connection String",
    regex: /\b(postgres|mongodb\+srv|mysql):\/\/[^:\s]+:[^@\s]+@[^\s]+\b/g,
  },
  {
    type: "JWT Token",
    regex: /\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.[A-Za-z0-9-_.+/=]+\b/g,
  },
];

const IGNORE_SUBSTRINGS = [
  "process.env",
  "req.body",
  "req.query",
  "your_",
  "example",
  "placeholder",
  "<password>",
  "dummy",
];

export async function scanSecrets(
  projectPath: string,
): Promise<SecretFinding[]> {
  const files = await fg(
    ["**/*.ts", "**/*.js", "**/*.json", "**/*.env*", "**/*.yml", "**/*.yaml"],
    {
      cwd: projectPath,
      absolute: true,
      ignore: [
        "**/node_modules/**",
        "**/dist/**",
        "**/build/**",
        "**/.next/**",
        "**/package-lock.json",
      ],
    },
  );

  const findings: SecretFinding[] = [];

  for (const file of files) {
    try {
      const stats = fs.statSync(file);
      if (!stats.isFile() || stats.size > 1024 * 1024) continue;

      const content = fs.readFileSync(file, "utf8");
      const lines = content.split("\n");
      const relPath = normalizePath(path.relative(projectPath, file));

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        if (IGNORE_SUBSTRINGS.some((sub) => lowerLine.includes(sub))) {
          continue;
        }

        for (const pattern of PATTERNS) {
          const re = new RegExp(pattern.regex.source, "g");
          let match: RegExpExecArray | null;
          while ((match = re.exec(line)) !== null) {
            const rawMatch = match[1] || match[0];
            const masked = maskSecret(rawMatch);
            const duplicate = findings.some(
              (f) =>
                f.file === relPath && f.line === i + 1 && f.type === pattern.type,
            );

            if (!duplicate) {
              findings.push({
                type: pattern.type,
                value: masked,
                file: relPath,
                line: i + 1,
              });
            }
          }
        }
      }
    } catch {
      // Ignore unparseable or unreadable individual files gracefully
    }
  }

  return findings;
}
