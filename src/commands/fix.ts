import ora from "ora";
import path from "node:path";
import fs from "node:fs";
import { FindingStore } from "../findings/findingStore.js";
import { hasApiKey } from "../core/config.js";
import { generateFixReport } from "../ai/llm.js";
import { extractDeepCodebaseContext } from "../ai/codebaseContext.js";
import { applyPatch, cleanBackup, restoreBackup } from "../core/patchApplier.js";
import { verifyPatchSafety } from "../core/verificationEngine.js";
import { colors, renderBanner, renderBox, renderDiff } from "../ui/render.js";
import { animateBanner, animateAiSynthesis } from "../ui/animation.js";

export interface FixCommandOptions {
  dryRun?: boolean;
  verify?: boolean;
}

export async function fixCommand(
  findingId?: string,
  options: FixCommandOptions = { dryRun: false, verify: true },
) {
  await animateBanner();

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
  if (!fs.existsSync(targetFilePath)) {
    console.log(colors.critical(` ✖ Target source file missing: ${finding.evidence.file}\n`));
    process.exit(1);
  }

  const deepContext = extractDeepCodebaseContext(projectPath, finding.evidence.file);

  try {
    let fixData = await animateAiSynthesis(
      `Extracting deep context & synthesizing AI patch for ${finding.id}...`,
      () => generateFixReport(finding, deepContext.targetFileContent, deepContext.formattedContext),
    );
    console.log();

    renderBox(
      `🛠️ REMEDIATION PATCH [${finding.id}]`,
      `Patch Title: ${fixData.patchTitle}\nRoot Cause: ${fixData.rootCause}`,
      colors.brand,
    );

    renderDiff(fixData.originalCodeSnippet, fixData.fixedCodeSnippet);

    renderBox(
      "🔒 SECURITY ASSURANCE & GUIDANCE",
      `${fixData.diffSummary}\n\nASSURANCE:\n${fixData.securityAssurance}`,
      colors.low,
    );
    console.log();

    if (options.dryRun) {
      console.log(colors.brand(" ℹ️ Dry-run mode enabled: No files modified on disk.\n"));
      return;
    }

    const patchResult = applyPatch(
      projectPath,
      finding.evidence.file,
      fixData.originalCodeSnippet,
      fixData.fixedCodeSnippet,
    );

    if (!patchResult.success) {
      console.log(colors.critical(` ✖ Patch application failed: ${patchResult.error}`));
      cleanBackup(patchResult.backupPath);
      process.exit(1);
    }

    console.log(colors.low(` ✔ Applied patch to file on disk: ${finding.evidence.file}`));

    let activeBackupPath = patchResult.backupPath;

    if (options.verify !== false) {
      const vSpinner = ora(colors.brand("Running zero-breakage verification pipeline (syntax, tsc, tests)...")).start();
      let verifyResult = await verifyPatchSafety(projectPath, finding.evidence.file);

      if (!verifyResult.passed) {
        vSpinner.warn(colors.high(`Initial patch failed verification [Stage: ${verifyResult.stage.toUpperCase()}]`));
        console.log(colors.medium(`   Reason: ${verifyResult.message}`));

        const retrySpinner = ora(colors.purple("Attempting AI self-correction retry with compiler error trace...")).start();
        try {
          const retriedFixData = await generateFixReport(
            finding,
            deepContext.targetFileContent,
            deepContext.formattedContext,
            verifyResult.errorLog || verifyResult.message,
          );

          if (activeBackupPath) {
            restoreBackup(targetFilePath, activeBackupPath);
          }

          const retryPatchResult = applyPatch(
            projectPath,
            finding.evidence.file,
            retriedFixData.originalCodeSnippet,
            retriedFixData.fixedCodeSnippet,
          );

          if (retryPatchResult.success) {
            if (retryPatchResult.backupPath) {
              activeBackupPath = retryPatchResult.backupPath;
            }
            verifyResult = await verifyPatchSafety(projectPath, finding.evidence.file);
            if (verifyResult.passed) {
              retrySpinner.succeed(colors.low("AI self-correction successful! Code compiles and tests pass."));
              fixData = retriedFixData;
            } else {
              retrySpinner.fail(colors.critical("AI self-correction patch also failed verification."));
            }
          } else {
            retrySpinner.fail(colors.critical("AI self-correction patch application failed."));
          }
        } catch {
          retrySpinner.fail(colors.critical("AI self-correction attempt failed."));
        }
      } else {
        vSpinner.succeed(colors.low("Zero-breakage verification passed! Code compiles cleanly and all tests pass."));
      }

      if (!verifyResult.passed) {
        console.log(colors.critical("\n ✖ Zero-breakage guarantee triggered: Rolling back file to original state."));
        if (activeBackupPath) {
          const restored = restoreBackup(targetFilePath, activeBackupPath);
          if (restored) {
            console.log(colors.low(` ✔ Successfully rolled back ${finding.evidence.file} to pre-patch state.`));
          } else {
            console.log(colors.critical(` ✖ Rollback failed. Please check backup at ${activeBackupPath}`));
          }
        }
        process.exit(1);
      }
    }

    cleanBackup(activeBackupPath);
    store.updateStatus(finding.id, "FIXED");
    store.saveToProject(projectPath);

    console.log(colors.low(`\n ✔ Finding ${finding.id} status updated to FIXED in .sentinel/findings.json\n`));
  } catch (err: any) {
    console.error(colors.critical(` Error: ${err?.message || err}`));
    process.exit(1);
  }
}
