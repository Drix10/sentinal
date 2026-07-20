import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";

import type { SecretFinding } from "../types";

//Got from google search

const PATTERNS = [
  {
    type: "Google API Key",
    regex: /\b(AIzaSy[A-Za-z0-9_-]{33}|AQ[A-Za-z0-9_-]{37})\b/,
  },
  {
    type: "OpenAI API Key",
    regex:
      /\b(sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}|sk-proj-[a-zA-Z0-9_-]{48,})\b/,
  },
  {
    type: "AWS Access Key",
    regex: /\b(AKIA|ASIA|ABIA|ACCA)[A-Z0-9]{16}\b/,
  },
  {
    type: "JWT Secret",
    regex: /\beyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*\b/,
  },
  {
    type: "Password",
    regex:
      /(?<=\b(password|pwd|passwd|secret|pass|token)['"]?\s*[:=]\s*['"])[^'"]{4,}/i,
  },
];

export async function scanSecrets(
  projectPath: string,
): Promise<SecretFinding[]> {
  const files = await fg(["**/*.ts", "**/*.js", "**/*.env"], {
    cwd: projectPath,
    absolute: true,
    ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
  });

  const findings: SecretFinding[] = [];

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of PATTERNS) {
        pattern.regex.lastIndex = 0;
        const matches = line.match(pattern.regex);

        if (!matches) continue;

        for (const match of matches) {
          findings.push({
            type: pattern.type,
            value: match,
            file: path.relative(projectPath, file),
            line: i + 1,
          });
        }
      }
    }
  }
  return findings;
}
