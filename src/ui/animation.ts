import chalk from "chalk";
import ora from "ora";
import { colors, renderScoreBadge, renderBanner } from "./render.js";

export function isInteractive(): boolean {
  return Boolean(process.stdout.isTTY && !process.env.CI && !process.env.NO_ANIMATION);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function animateBanner(): Promise<void> {
  if (!isInteractive()) {
    renderBanner();
    return;
  }

  console.clear();
  const bannerLines = [
    " ╔══════════════════════════════════════════════════════════════════════╗",
    " ║         S E N T I N E L   A I   S E C U R I T Y   C L I              ║",
    " ║      Deterministic Program Analysis • Attack Graph • AI Reasoning    ║",
    " ╚══════════════════════════════════════════════════════════════════════╝",
  ];

  for (let i = 0; i < bannerLines.length; i++) {
    console.log(colors.brand(bannerLines[i]));
    await sleep(25);
  }
  console.log();
}

export async function animateScoreGauge(targetScore: number): Promise<void> {
  if (!isInteractive()) {
    console.log(renderScoreBadge(targetScore));
    return;
  }

  const steps = 15;
  const increment = targetScore / steps;

  const initialBadge = renderScoreBadge(0).trim();
  console.log(initialBadge);
  await sleep(35);

  for (let i = 1; i <= steps; i++) {
    const currentScore = Math.min(targetScore, Math.round(i * increment));
    process.stdout.write("\x1b[1F\x1b[2K");
    process.stdout.write("\x1b[1F\x1b[2K");
    process.stdout.write("\x1b[1F\x1b[2K");
    process.stdout.write("\x1b[1F\x1b[2K");
    console.log(renderScoreBadge(currentScore).trim());
    await sleep(35);
  }
  console.log();
}

export async function animateAiSynthesis<T>(
  initialText: string,
  actionFn: () => Promise<T>,
): Promise<T> {
  if (!isInteractive()) {
    const spinner = ora(initialText).start();
    try {
      const result = await actionFn();
      spinner.succeed(chalk.green("Security Report Synthesized Successfully!"));
      return result;
    } catch (err) {
      spinner.fail(chalk.red("Security Analysis Failed"));
      throw err;
    }
  }

  const spinner = ora({
    text: initialText,
    spinner: {
      interval: 80,
      frames: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
    },
  }).start();

  const statusPhases = [
    "⚡ Initializing Gemini 3.5 Flash Neural Reasoning Engine...",
    "🧠 Analyzing AST Topology & Multi-File Codebase Context...",
    "🛡️ Evaluating Security Vulnerabilities & OWASP Top 10 Risks...",
    "📊 Synthesizing Risk Score & Remediation Priorities...",
  ];

  let phaseIdx = 0;
  const interval = setInterval(() => {
    phaseIdx = (phaseIdx + 1) % statusPhases.length;
    spinner.text = chalk.cyan(statusPhases[phaseIdx]);
  }, 1200);

  try {
    const result = await actionFn();
    spinner.succeed(chalk.bold.green(" Security Report Synthesized Successfully!"));
    return result;
  } catch (err) {
    spinner.fail(chalk.bold.red(" AI Security Analysis Failed"));
    throw err;
  } finally {
    clearInterval(interval);
  }
}

export async function animateStep(stepName: string, stepIndex: number, totalSteps: number): Promise<void> {
  const safeTotal = Math.max(1, totalSteps);
  const barLen = 20;
  const progress = Math.min(barLen, Math.max(0, Math.round((stepIndex / safeTotal) * barLen)));
  const bar = "█".repeat(progress) + "░".repeat(barLen - progress);
  const statusStr = chalk.bold.cyan(` [${stepIndex}/${safeTotal}] `) + chalk.yellow(`[${bar}] `) + chalk.white(stepName);

  if (isInteractive()) {
    process.stdout.write(`\r\x1b[2K${statusStr}`);
    await sleep(60);
    if (stepIndex >= safeTotal) {
      process.stdout.write("\n");
    }
  } else {
    console.log(statusStr);
  }
}
