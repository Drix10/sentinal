import chalk from "chalk";
import ora from "ora";
import path from "node:path";
import fs from "node:fs";
import { FindingStore } from "../findings/findingStore.js";
import { generateExplainReport } from "../ai/llm.js";
import { extractDeepCodebaseContext } from "../ai/codebaseContext.js";
import { colors, renderBanner, renderBox } from "../ui/render.js";
import { animateBanner, animateAiSynthesis } from "../ui/animation.js";

export async function explainCommand(findingId?: string) {
  await animateBanner();

  if (!findingId) {
    console.log(colors.critical(" ✖ Error: Finding ID required."));
    console.log(colors.medium("   Example: sentinel explain FINDING-100\n"));
    process.exit(1);
  }

  const projectPath = process.cwd();
  const store = new FindingStore();
  const loaded = store.loadFromProject(projectPath);

  if (!loaded) {
    console.log(colors.medium(" ⚠️ No scan findings found in current directory."));
    console.log(colors.brand("   Run 'sentinel attack .' first to generate findings.\n"));
    process.exit(1);
  }

  const finding = store.getFinding(findingId.toUpperCase());
  if (!finding) {
    console.log(colors.critical(` ✖ Finding not found: ${findingId}`));
    console.log(colors.gray("   Run 'sentinel attack .' to view available finding IDs.\n"));
    process.exit(1);
  }

  const fullPath = path.resolve(projectPath, finding.evidence.file);
  let fileContent = "";
  if (fs.existsSync(fullPath)) {
    try {
      fileContent = fs.readFileSync(fullPath, "utf8");
    } catch {
      fileContent = "// Unable to read source file";
    }
  }

  const deepContext = extractDeepCodebaseContext(projectPath, finding.evidence.file);

  try {
    const explainData = await animateAiSynthesis(
      `Analyzing finding ${finding.id} with deep AI reasoning...`,
      () => generateExplainReport(finding, fileContent, deepContext.formattedContext)
    );

    const severityColor =
      finding.severity === "CRITICAL"
        ? colors.critical
        : finding.severity === "HIGH"
          ? colors.high
          : finding.severity === "MEDIUM"
            ? colors.medium
            : colors.low;

    renderBox(
      `🔍 FINDING OVERVIEW [${finding.id}]`,
      `Title: ${finding.title}\nSeverity: ${severityColor(finding.severity)}  |  Confidence: ${(finding.confidence * 100).toFixed(0)}%\nOWASP: ${finding.owaspCategory}\nCWE: ${finding.cweId ?? "N/A"}\nLocation: ${finding.evidence.file}:${finding.evidence.line}`,
      severityColor,
    );
    console.log();

    renderBox("📋 EXECUTIVE SUMMARY & ROOT CAUSE", `${explainData.summary}\n\nROOT CAUSE:\n${explainData.rootCause}`, colors.brand);
    console.log();

    renderBox("⚡ EXPLOIT MECHANISM & IMPACT", `EXPLOIT MECHANISM:\n${explainData.exploitMechanism}\n\nIMPACT ANALYSIS:\n${explainData.impactAnalysis}`, colors.high);
    console.log();

    if (fileContent) {
      const lines = fileContent.split("\n");
      const targetLine = Math.max(1, finding.evidence.line || 1);
      const lineIdx = targetLine - 1;
      const start = Math.max(0, lineIdx - 2);
      const end = Math.min(lines.length, lineIdx + 3);

      console.log(colors.purple(" 📄 SOURCE CODE EVIDENCE:"));
      console.log(colors.dim(" ──────────────────────────────────────────────────────────────────────"));
      for (let i = start; i < end; i++) {
        const lineNum = String(i + 1).padStart(4, " ");
        const lineText = lines[i];
        if (i === lineIdx) {
          console.log(chalk.bgRed.white(`  > ${lineNum} | ${lineText}`));
        } else {
          console.log(colors.dim(`    ${lineNum} | ${lineText}`));
        }
      }
      console.log(colors.dim(" ──────────────────────────────────────────────────────────────────────\n"));
    }

    renderBox(
      "🛡️ STEP-BY-STEP REMEDIATION GUIDE",
      explainData.stepByStepRemediation.map((step: string, idx: number) => `${idx + 1}. ${step}`).join("\n"),
      colors.low,
    );
    console.log();

    console.log(colors.dim(" ══════════════════════════════════════════════════════════════════════"));
    console.log(colors.brand(` To generate an autonomous code patch, run:`));
    console.log(colors.white(`   sentinel fix ${finding.id}\n`));
  } catch (err: any) {
    console.error(colors.critical(` Error: ${err?.message || err}`));
    process.exit(1);
  }
}
