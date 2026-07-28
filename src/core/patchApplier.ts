import fs from "node:fs";
import path from "node:path";

export interface PatchApplyResult {
  success: boolean;
  backupPath?: string;
  error?: string;
}

export function createBackup(projectPath: string, targetFileRel: string): string {
  const sentinelBackupDir = path.join(projectPath, ".sentinel", "backups");
  if (!fs.existsSync(sentinelBackupDir)) {
    fs.mkdirSync(sentinelBackupDir, { recursive: true });
  }

  const absTarget = path.resolve(projectPath, targetFileRel);
  const sanitizedRelName = targetFileRel.replace(/[\/\\]/g, "_");
  const backupFileName = `${sanitizedRelName}.${Date.now()}.bak`;
  const backupPath = path.join(sentinelBackupDir, backupFileName);

  if (fs.existsSync(absTarget)) {
    fs.copyFileSync(absTarget, backupPath);
  }

  return backupPath;
}

export function restoreBackup(targetAbsPath: string, backupPath: string): boolean {
  try {
    if (fs.existsSync(backupPath)) {
      fs.copyFileSync(backupPath, targetAbsPath);
      fs.unlinkSync(backupPath);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function cleanBackup(backupPath?: string) {
  if (backupPath && fs.existsSync(backupPath)) {
    try {
      fs.unlinkSync(backupPath);
    } catch {
      // Ignore cleanup error
    }
  }
}

export function applyPatch(
  projectPath: string,
  targetFileRel: string,
  originalSnippet: string,
  fixedSnippet: string,
): PatchApplyResult {
  const absTarget = path.resolve(projectPath, targetFileRel);

  if (!fs.existsSync(absTarget)) {
    return { success: false, error: `Target file not found on disk: ${targetFileRel}` };
  }

  const backupPath = createBackup(projectPath, targetFileRel);

  try {
    let fileContent = fs.readFileSync(absTarget, "utf8");
    const isCRLF = fileContent.includes("\r\n");

    const normFileContent = fileContent.replace(/\r\n/g, "\n");
    const normOriginal = originalSnippet.replace(/\r\n/g, "\n").trim();
    const normFixed = fixedSnippet.replace(/\r\n/g, "\n").trim();

    if (!normOriginal) {
      return {
        success: false,
        backupPath,
        error: "Original code snippet is empty or whitespace-only.",
      };
    }

    if (!normFileContent.includes(normOriginal)) {
      // Fuzzy line-by-line fallback matching if exact snippet differs slightly by whitespace
      const origLines = normOriginal.split("\n").map((l) => l.trim()).filter(Boolean);
      const fileLines = normFileContent.split("\n");

      const matchIndices: number[] = [];
      for (let i = 0; i <= fileLines.length - origLines.length; i++) {
        let match = true;
        for (let j = 0; j < origLines.length; j++) {
          if (fileLines[i + j].trim() !== origLines[j]) {
            match = false;
            break;
          }
        }
        if (match) {
          matchIndices.push(i);
        }
      }

      if (matchIndices.length > 1) {
        return {
          success: false,
          backupPath,
          error: `Original code snippet occurs multiple (${matchIndices.length}) times in source file and cannot be uniquely identified.`,
        };
      }

      if (matchIndices.length === 1) {
        const matchStartIndex = matchIndices[0];
        fileLines.splice(matchStartIndex, origLines.length, normFixed);
        let updatedContent = fileLines.join("\n");
        if (isCRLF) updatedContent = updatedContent.replace(/\n/g, "\r\n");
        fs.writeFileSync(absTarget, updatedContent, "utf8");
        return { success: true, backupPath };
      }

      return {
        success: false,
        backupPath,
        error: "Original code snippet could not be located in source file for physical replacement.",
      };
    }

    const occurrences = normFileContent.split(normOriginal).length - 1;
    if (occurrences > 1) {
      return {
        success: false,
        backupPath,
        error: `Original code snippet occurs multiple (${occurrences}) times in source file and cannot be uniquely identified.`,
      };
    }

    let updatedContent = normFileContent.replace(normOriginal, normFixed);
    if (isCRLF) {
      updatedContent = updatedContent.replace(/\n/g, "\r\n");
    }

    fs.writeFileSync(absTarget, updatedContent, "utf8");
    return { success: true, backupPath };
  } catch (err: any) {
    return {
      success: false,
      backupPath,
      error: `Failed to write patch to disk: ${err?.message || err}`,
    };
  }
}
