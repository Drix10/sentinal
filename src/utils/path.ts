import fs from "node:fs";
import path from "node:path";

export function normalizePath(filePath: string): string {
  if (!filePath) return "";
  return filePath.replace(/\\/g, "/");
}

export function validateProjectRelativePath(projectPath: string, rawPath: string, fallback = "package.json"): string {
  if (!rawPath || typeof rawPath !== "string") return fallback;

  const fileMatch = rawPath.match(/(?:[a-zA-Z]:[\\/])?(?:\.?\.?[\\/])?(?:\.[a-zA-Z0-9_\-]+|[a-zA-Z0-9_\-]+)(?:[\\/](?:\.[a-zA-Z0-9_\-]+|[a-zA-Z0-9_\-]+))*\.(?:json|tsx|jsx|yaml|env|yml|ts|js|md|config|mjs|cjs)\b/i);

  const candidate = fileMatch ? fileMatch[0] : rawPath.trim();

  try {
    const resolvedProj = path.resolve(projectPath);
    const resolvedCandidate = path.resolve(resolvedProj, candidate);

    const projPrefix = resolvedProj.endsWith(path.sep) ? resolvedProj : resolvedProj + path.sep;
    if (resolvedCandidate !== resolvedProj && !resolvedCandidate.startsWith(projPrefix)) {
      return fallback;
    }

    if (!fs.existsSync(resolvedCandidate) || !fs.statSync(resolvedCandidate).isFile()) {
      return fallback;
    }

    const realCandidate = fs.realpathSync(resolvedCandidate);
    const realProj = fs.realpathSync(resolvedProj);
    const realProjPrefix = realProj.endsWith(path.sep) ? realProj : realProj + path.sep;
    if (realCandidate !== realProj && !realCandidate.startsWith(realProjPrefix)) {
      return fallback;
    }

    const relPath = path.relative(resolvedProj, resolvedCandidate);
    return normalizePath(relPath || fallback);
  } catch {
    return fallback;
  }
}
