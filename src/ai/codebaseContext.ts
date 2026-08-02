import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "../utils/path.js";

export interface LocalModuleContext {
  importPath: string;
  resolvedFile?: string;
  snippet?: string;
}

export interface DeepCodebaseContext {
  targetFile: string;
  targetFileContent: string;
  importedModules: LocalModuleContext[];
  packageDependencies: string[];
  projectFramework: string;
  formattedContext: string;
}

export function extractDeepCodebaseContext(
  projectPath: string,
  targetFileRelPath: string,
): DeepCodebaseContext {
  const normalizedRel = normalizePath(targetFileRelPath);
  const targetAbsPath = path.resolve(projectPath, normalizedRel);

  let targetFileContent = "";
  if (fs.existsSync(targetAbsPath)) {
    try {
      targetFileContent = fs.readFileSync(targetAbsPath, "utf8");
    } catch {
      targetFileContent = "// Unable to read target file content";
    }
  }

  const importedModules: LocalModuleContext[] = [];
  const dirOfTarget = path.dirname(targetAbsPath);

  const importRegex = /(?:import|from|require)\s*\(?\s*['"](\.[^'"]+)['"]/g;
  let match: RegExpExecArray | null;

  const resolvedProjectPath = path.resolve(projectPath);
  const projectRootPrefix = resolvedProjectPath.endsWith(path.sep)
    ? resolvedProjectPath
    : resolvedProjectPath + path.sep;

  const seenModules = new Set<string>();

  while ((match = importRegex.exec(targetFileContent)) !== null) {
    const importSpecifier = match[1];
    if (seenModules.has(importSpecifier)) continue;
    seenModules.add(importSpecifier);
    const extensionsToTry = [
      "",
      ".ts",
      ".js",
      ".tsx",
      ".jsx",
      "/index.ts",
      "/index.js",
      "/index.tsx",
      "/index.jsx",
    ];
    let resolvedAbsPath: string | undefined;

    for (const ext of extensionsToTry) {
      const candidate = path.resolve(dirOfTarget, importSpecifier + ext);
      const isUnderProjectRoot =
        candidate === resolvedProjectPath || candidate.startsWith(projectRootPrefix);
      if (!isUnderProjectRoot) {
        continue;
      }
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        resolvedAbsPath = candidate;
        break;
      }
    }

    if (resolvedAbsPath) {
      const relResolved = normalizePath(path.relative(projectPath, resolvedAbsPath));
      let snippet = "";
      try {
        const fullContent = fs.readFileSync(resolvedAbsPath, "utf8");
        snippet = fullContent.split("\n").slice(0, 60).join("\n");
      } catch {
        snippet = "// Could not read module";
      }

      importedModules.push({
        importPath: importSpecifier,
        resolvedFile: relResolved,
        snippet,
      });
    } else {
      importedModules.push({
        importPath: importSpecifier,
      });
    }
  }

  const packageDependencies: string[] = [];
  const pkgPath = path.join(projectPath, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      const allDeps = {
        ...(pkg.dependencies || {}),
        ...(pkg.devDependencies || {}),
      };
      for (const [name, version] of Object.entries(allDeps)) {
        packageDependencies.push(`${name}@${version}`);
      }
    } catch {
    }
  }

  const contextBlocks: string[] = [];

  contextBlocks.push(`TARGET FILE PATH: ${normalizedRel}`);
  contextBlocks.push(`AVAILABLE PACKAGE DEPENDENCIES:\n${packageDependencies.length > 0 ? packageDependencies.join(", ") : "None specified"}`);

  if (importedModules.length > 0) {
    contextBlocks.push("IMPORTED LOCAL MODULE CONTEXT:");
    for (const mod of importedModules) {
      if (mod.resolvedFile && mod.snippet) {
        contextBlocks.push(`--- Module [${mod.importPath}] (${mod.resolvedFile}) ---\n${mod.snippet}\n--- End Module ---`);
      } else {
        contextBlocks.push(`--- Module [${mod.importPath}] (Unresolved) ---`);
      }
    }
  }

  const formattedContext = contextBlocks.join("\n\n");

  return {
    targetFile: normalizedRel,
    targetFileContent,
    importedModules,
    packageDependencies,
    projectFramework: "Node.js/TypeScript",
    formattedContext,
  };
}
