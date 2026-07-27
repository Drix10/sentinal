import chalk from "chalk";
import ora from "ora";
import path from "node:path";
import fs from "node:fs";
import { FindingStore } from "../findings/findingStore";
import { getApiKey, hasApiKey } from "../core/config";
import { generateFixReport } from "../ai/llm";
import { colors, renderBanner, renderBox, renderDiff } from "../ui/render";

export async function fixCommand(findingId?: string) {
  renderBanner();

  if (!findingId) {
    console.log(colors.critical(" ✖ Error: Finding ID required."));
    console.log(colors.medium("   Example: sentinel fix FINDING-100\n"));
    process.exit(1);
  }

  if (!hasApiKey()) {
    console.log(colors.critical(" ✖ Gemini API Key not configured. Run 'sentinel set-key' first.\n"));
    process.exit(1);
  }

  const projectPath = process.cwd();
  const store = new FindingStore();
  const loaded = store.loadFromProject(projectPath);

  if (!loaded) {
    console.log(colors.medium(" ⚠️ No scan findings found in current directory. Run 'sentinel attack .' first.\n"));
    process.exit(1);
  }

  const finding = store.getFinding(findingId.toUpperCase());
  if (!finding) {
    console.log(colors.critical(` ✖ Finding not found: ${findingId}`));
    process.exit(1);
  }

  const targetFilePath = path.resolve(projectPath, finding.evidence.file);
  let fileContent = "";
  if (fs.existsSync(targetFilePath)) {
    try {
      fileContent = fs.readFileSync(targetFilePath, "utf8");
    } catch {
      fileContent = "// Unable to read file content";
    }
  }

  const spinner = ora(colors.brand(`Synthesizing AI patch for ${finding.id}...`)).start();

  try {
    const fixData = await generateFixReport(finding, fileContent);
    spinner.succeed(colors.low(`Autonomous security patch synthesized!`));
    console.log();

    renderBox(`🛠️ REMEDIATION PATCH [${finding.id}]`, `Patch Title: ${fixData.patchTitle}\nRoot Cause: ${fixData.rootCause}`, colors.brand);

    renderDiff(fixData.originalCodeSnippet, fixData.fixedCodeSnippet);

    renderBox("🔒 SECURITY ASSURANCE & GUIDANCE", `${fixData.diffSummary}\n\nASSURANCE:\n${fixData.securityAssurance}`, colors.low);
    console.log();

    store.updateStatus(finding.id, "FIXED");
    store.saveToProject(projectPath);

    console.log(colors.low(` ✔ Finding ${finding.id} status updated to FIXED in .sentinel/findings.json\n`));
  } catch (err: any) {
    spinner.fail(colors.critical("Failed to generate AI remediation patch."));
    console.error(colors.critical(` Error: ${err?.message || err}`));
    process.exit(1);
  }
}
