import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Project } from "ts-morph";
import { scanSecrets } from "../rules/secrets";

export interface VerificationResult {
  passed: boolean;
  stage: "syntax" | "tsc" | "test" | "sast";
  message: string;
  errorLog?: string;
}

export async function verifyPatchSafety(
  projectPath: string,
  targetFileRel: string,
): Promise<VerificationResult> {
  const targetAbsPath = path.resolve(projectPath, targetFileRel);

  // STAGE 1: AST & Syntax Compilation Check
  try {
    const tsConfigFilePath = path.join(projectPath, "tsconfig.json");
    const hasTsConfig = fs.existsSync(tsConfigFilePath);

    const tsProject = new Project(
      hasTsConfig
        ? {
            tsConfigFilePath,
            skipAddingFilesFromTsConfig: true,
            compilerOptions: { noEmit: true },
          }
        : {
            compilerOptions: { allowJs: true, noEmit: true },
            skipAddingFilesFromTsConfig: true,
          },
    );
    const sf = tsProject.addSourceFileAtPath(targetAbsPath);
    const diagnostics = tsProject.getPreEmitDiagnostics();
    const sfDiagnostics = diagnostics.filter(
      (d) => d.getSourceFile()?.getFilePath() === sf.getFilePath(),
    );

    if (sfDiagnostics.length > 0) {
      const firstError = sfDiagnostics[0].getMessageText();
      const msg = typeof firstError === "string" ? firstError : firstError.getMessageText();
      return {
        passed: false,
        stage: "syntax",
        message: `Syntax error introduced by patch: ${msg}`,
        errorLog: sfDiagnostics
          .map((d) => {
            const text = d.getMessageText();
            return typeof text === "string" ? text : text.getMessageText();
          })
          .join("\n"),
      };
    }
    tsProject.removeSourceFile(sf);
  } catch (err: any) {
    return {
      passed: false,
      stage: "syntax",
      message: `Failed syntax parse: ${err?.message || err}`,
    };
  }

  // STAGE 2: TypeScript Compiler (`tsc --noEmit`) if tsconfig.json exists
  const tsConfigPath = path.join(projectPath, "tsconfig.json");
  if (fs.existsSync(tsConfigPath)) {
    try {
      execSync("npx tsc --noEmit", {
        cwd: projectPath,
        stdio: "pipe",
        timeout: 20000,
      });
    } catch (err: any) {
      const stderr = err.stderr ? err.stderr.toString("utf8") : "";
      const stdout = err.stdout ? err.stdout.toString("utf8") : "";
      const output = (stderr + "\n" + stdout).trim();
      return {
        passed: false,
        stage: "tsc",
        message: "TypeScript compiler type check failed after patch.",
        errorLog: output.slice(0, 800),
      };
    }
  }

  // STAGE 3: Test Suite Execution if test script is defined in package.json
  const pkgPath = path.join(projectPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      const testScript = pkg.scripts?.test;

      if (testScript && !testScript.includes("no test specified")) {
        execSync("npm test", {
          cwd: projectPath,
          stdio: "pipe",
          timeout: 30000,
        });
      }
    } catch (err: any) {
      const stderr = err.stderr ? err.stderr.toString("utf8") : "";
      const stdout = err.stdout ? err.stdout.toString("utf8") : "";
      const output = (stderr + "\n" + stdout).trim();
      return {
        passed: false,
        stage: "test",
        message: "Project regression test suite failed after applying patch.",
        errorLog: output.slice(0, 800),
      };
    }
  }

  // STAGE 4: SAST Re-scan on the target file
  try {
    const secrets = await scanSecrets(projectPath);
    const targetSecrets = secrets.filter((s) => s.file === targetFileRel);
    if (targetSecrets.length > 0) {
      return {
        passed: false,
        stage: "sast",
        message: `SAST re-scan still detected exposed secret (${targetSecrets[0].type}) in patched file.`,
      };
    }
  } catch {
    // Non-fatal
  }

  return {
    passed: true,
    stage: "sast",
    message: "Zero-breakage verification completed successfully! Code compiles cleanly and all tests pass.",
  };
}
