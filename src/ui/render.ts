import chalk from "chalk";

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

export function renderBanner() {
  console.clear();
  console.log(
    colors.brand(`
 ╔══════════════════════════════════════════════════════════════════════╗
 ║  🛡️   S E N T I N E L   A I   S E C U R I T Y   P L A T F O R M   ║
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

  return `
 ┌──────────────────────────────────────────────────────────────────────┐
 │  SECURITY RISK SCORE: ${color(`${score}/100`)}   [${color(bar)}]  │
 │  STATUS: ${color(status)}                                      │
 └──────────────────────────────────────────────────────────────────────┘
`;
}

export function renderBox(
  title: string,
  content: string,
  borderColor = colors.brand,
) {
  const lines = content.split("\n");
  const cleanTitle = stripAnsi(title);
  const visibleLengths = lines.map((l) => stripAnsi(l).length);
  const width = Math.max(
    68,
    cleanTitle.length + 6,
    ...visibleLengths.map((len) => len + 4),
  );

  console.log(
    borderColor(`┌── ${title} ${"─".repeat(Math.max(0, width - cleanTitle.length - 5))}┐`),
  );
  for (const line of lines) {
    const visLen = stripAnsi(line).length;
    console.log(
      `${borderColor("│")}  ${line}${" ".repeat(Math.max(0, width - visLen - 4))}  ${borderColor("│")}`,
    );
  }
  console.log(borderColor(`└${"─".repeat(width - 1)}┘`));
}

export function renderIRSummary(fileCount: number, routeCount: number) {
  renderBox(
    "🧩 SENTINEL IR COMPILER METRICS (@sentinel/plugin-typescript)",
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
    "🕸️ KNOWLEDGE GRAPH & ATTACK GRAPH ENGINE MATRIX",
    `Knowledge Graph Nodes: ${nodeCount} (Routes, Secrets, Dependencies)\nTopology Edges: ${edgeCount} (USES_DEPENDENCY, READS_SECRET)\nSynthesized Exploit Paths: ${statusColor(`${exploitCount} Attack Graph Vectors`)}`,
    colors.brand,
  );
  console.log();
}

export function renderDiff(originalCode: string, fixedCode: string) {
  console.log(colors.purple("\n 🔄 CODE REMEDIATION DIFF:"));
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
