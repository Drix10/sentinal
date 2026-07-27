import chalk from "chalk";
import path from "node:path";
import { normalizePath } from "../utils/path";

export const colors = {
  brand: chalk.hex("#00F5FF").bold,
  purple: chalk.hex("#9D4EDD").bold,
  critical: chalk.hex("#FF0055").bold,
  high: chalk.hex("#FF7700").bold,
  medium: chalk.hex("#FFCC00").bold,
  low: chalk.hex("#00FF88").bold,
  info: chalk.hex("#00B4D8").bold,
  gray: chalk.hex("#6C757D"),
  white: chalk.white.bold,
  dim: chalk.gray,
};

function stripAnsi(str: string): string {
  return str.replace(/\u001b\[[0-9;]*m/g, "");
}

function getVisualWidth(str: string): number {
  const clean = stripAnsi(str);
  let width = 0;
  for (const char of clean) {
    const code = char.codePointAt(0);
    if (!code) continue;
    if (
      code === 0x200d ||
      (code >= 0x0300 && code <= 0x036f) ||
      (code >= 0xfe00 && code <= 0xfe0f)
    ) {
      width += 0;
    } else if (
      (code >= 0x1f300 && code <= 0x1f9ff) ||
      (code >= 0x2600 && code <= 0x26ff) ||
      (code >= 0x2700 && code <= 0x27bf) ||
      (code >= 0x1f000 && code <= 0x1f02f) ||
      (code >= 0x1f0a0 && code <= 0x1f0ff) ||
      (code >= 0x20000 && code <= 0x2ffff)
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

function wrapLine(text: string, maxLen: number): string[] {
  const cleanText = stripAnsi(text);
  if (!cleanText || getVisualWidth(text) <= maxLen) return [text];

  const indentMatch = text.match(/^(\s+)/);
  const indent = indentMatch ? indentMatch[1] : "";

  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = indent;

  for (const word of words) {
    const candidate = currentLine === indent ? `${indent}${word}` : `${currentLine} ${word}`;
    if (getVisualWidth(candidate) <= maxLen) {
      currentLine = candidate;
    } else {
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = `${indent}${word}`;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);
  return lines.length > 0 ? lines : [text];
}

export function renderBanner() {
  console.clear();
  console.log(
    colors.brand(`
 ╔══════════════════════════════════════════════════════════════════════╗
 ║      S E N T I N E L   A I   S E C U R I T Y   P L A T F O R M       ║
 ║      Deterministic Program Analysis • Attack Graph • AI Reasoning    ║
 ╚══════════════════════════════════════════════════════════════════════╝
`),
  );
}

export function renderScoreBadge(score: number): string {
  let color = colors.low;
  let status = "GOOD SECURITY POSTURE";

  if (score < 50) {
    color = colors.critical;
    status = "CRITICAL RISK - IMMEDIATE ACTION REQUIRED";
  } else if (score < 75) {
    color = colors.high;
    status = "MODERATE RISK - ATTACK VECTORS IDENTIFIED";
  }

  const barWidth = 30;
  const filled = Math.round((score / 100) * barWidth);
  const bar = "█".repeat(filled) + "░".repeat(barWidth - filled);

  const line1Content = `  SECURITY RISK SCORE: ${color(`${score}/100`)}   [${color(bar)}]`;
  const line2Content = `  STATUS: ${color(status)}`;

  const vis1 = getVisualWidth(line1Content);
  const vis2 = getVisualWidth(line2Content);

  const innerW = 74;
  const pad1 = Math.max(0, innerW - vis1);
  const pad2 = Math.max(0, innerW - vis2);

  return `
 ┌──────────────────────────────────────────────────────────────────────────┐
 │${line1Content}${" ".repeat(pad1)}│
 │${line2Content}${" ".repeat(pad2)}│
 └──────────────────────────────────────────────────────────────────────────┘
`;
}

export function renderBox(
  title: string,
  content: string,
  borderColor = colors.brand,
  boxWidth = 78,
) {
  const innerWidth = boxWidth - 4;
  const rawLines = content.split("\n");
  const wrappedLines: string[] = [];

  for (const l of rawLines) {
    if (getVisualWidth(l) > innerWidth) {
      wrappedLines.push(...wrapLine(l, innerWidth));
    } else {
      wrappedLines.push(l);
    }
  }

  const titleVisWidth = getVisualWidth(title);
  const titleBarLen = Math.max(0, boxWidth - titleVisWidth - 6);

  console.log(
    borderColor(`┌── ${title} ${"─".repeat(titleBarLen)}┐`),
  );

  for (const line of wrappedLines) {
    const visLen = getVisualWidth(line);
    const rightPad = Math.max(0, innerWidth - visLen);
    console.log(
      `${borderColor("│")} ${line}${" ".repeat(rightPad)} ${borderColor("│")}`,
    );
  }

  console.log(borderColor(`└${"─".repeat(boxWidth - 2)}┘`));
}

export function renderCustomTable(
  columns: { key: string; label: string; width: number }[],
  data: Record<string, any>[],
  borderColor = colors.brand,
) {
  if (!data || data.length === 0) return;

  const header = columns
    .map((c) => {
      const vis = getVisualWidth(c.label);
      const pad = Math.max(0, c.width - vis);
      return colors.white(c.label + " ".repeat(pad));
    })
    .join(borderColor(" │ "));

  const divider = columns.map((c) => "─".repeat(c.width)).join(borderColor("─┼─"));

  console.log(
    borderColor(`┌─${columns.map((c) => "─".repeat(c.width)).join("─┬─")}─┐`),
  );
  console.log(`${borderColor("│")} ${header} ${borderColor("│")}`);
  console.log(borderColor(`├─${divider}─┤`));

  for (const row of data) {
    const rowStr = columns
      .map((c) => {
        const rawVal = String(row[c.key] ?? "");
        const cleanVal = stripAnsi(rawVal);
        const truncated = cleanVal.length > c.width
          ? cleanVal.slice(0, c.width - 3) + "..."
          : cleanVal;
        const pad = Math.max(0, c.width - getVisualWidth(truncated));
        return truncated + " ".repeat(pad);
      })
      .join(borderColor(" │ "));
    console.log(`${borderColor("│")} ${rowStr} ${borderColor("│")}`);
  }

  console.log(
    borderColor(`└─${columns.map((c) => "─".repeat(c.width)).join("─┴─")}─┘`),
  );
}

export function renderIRSummary(fileCount: number, routeCount: number) {
  renderBox(
    "[+] SENTINEL IR COMPILER METRICS (@sentinel/plugin-typescript)",
    `IR Project Compilation: Successful\nAST Source Files Parsed: ${fileCount}\nExtracted API Routes: ${routeCount}\nAST Node Processing: TypeScript Morph Plugin Active`,
    colors.purple,
  );
  console.log();
}

export function renderGraphSummary(
  nodeCount: number,
  edgeCount: number,
  exploitCount: number,
) {
  const statusColor = exploitCount > 0 ? colors.critical : colors.low;
  renderBox(
    "[+] KNOWLEDGE GRAPH & ATTACK GRAPH ENGINE MATRIX",
    `Knowledge Graph Nodes: ${nodeCount} (Routes, Secrets, Dependencies)\nTopology Edges: ${edgeCount} (USES_DEPENDENCY, READS_SECRET)\nSynthesized Exploit Paths: ${statusColor(`${exploitCount} Attack Graph Vectors`)}`,
    colors.brand,
  );
  console.log();
}

export function renderNextSteps(firstFindingId?: string, savedFile?: string) {
  let nextStepsText = colors.brand("DEVELOPER REMEDIATION WORKFLOW & NEXT STEPS:\n");

  if (firstFindingId) {
    nextStepsText += `
 1. Examine OWASP Details & Source Evidence:
    ${colors.white(`sentinel explain ${firstFindingId}`)}

 2. Synthesize Autonomous AI Security Patch:
    ${colors.white(`sentinel fix ${firstFindingId}`)}

 3. Triage False Positives or Accept Risk:
    ${colors.white(`sentinel ignore ${firstFindingId} --reason "Reviewed by AppSec team"`)}

 4. Re-verify Code Base After Remediation:
    ${colors.white("sentinel attack .")}
`;
  } else {
    nextStepsText += `
 1. Continuous SAST Monitoring:
    Run ${colors.white("sentinel attack .")} regularly after pull requests.

 2. Secure Secret Management:
    Store API keys in environment vaults instead of repository files.

 3. CI/CD Security Integration:
    Add ${colors.white("npx sentinel-ai-cli attack .")} to your GitHub Actions pipeline.
`;
  }

  if (savedFile) {
    const relSaved = normalizePath(path.relative(process.cwd(), savedFile)) || ".sentinel/findings.json";
    nextStepsText += colors.dim(`\n Findings persisted to: ${relSaved}`);
  }

  renderBox("[+] NEXT STEPS & ACTION PLAN", nextStepsText.trim(), colors.low, 78);
  console.log();
}

export function renderDiff(originalCode: string, fixedCode: string) {
  console.log(colors.purple("\n [+] CODE REMEDIATION DIFF:"));
  console.log(
    colors.dim(
      " ──────────────────────────────────────────────────────────────────────",
    ),
  );

  const origLines = originalCode.split("\n");
  const fixedLines = fixedCode.split("\n");

  for (const line of origLines) {
    if (line.trim()) {
      console.log(chalk.red(`  - ${line}`));
    }
  }
  for (const line of fixedLines) {
    if (line.trim()) {
      console.log(chalk.green(`  + ${line}`));
    }
  }
  console.log(
    colors.dim(
      " ──────────────────────────────────────────────────────────────────────\n",
    ),
  );
}
