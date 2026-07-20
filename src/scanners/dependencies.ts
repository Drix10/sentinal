import fs from "node:fs";
import path from "node:path";

import type { DependencyInfo } from "../types";

export async function scanDependencies(
  projectPath: string,
): Promise<DependencyInfo[]> {
  const packageJson = path.join(projectPath, "package.json");

  if (!fs.existsSync(packageJson)) {
    return [];
  }

  const dependencies: DependencyInfo[] = [];
  const pkg = JSON.parse(fs.readFileSync(packageJson, "utf8"));

  for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
    dependencies.push({
      name,
      version: String(version),
      type: "dependency",
    });
  }
  for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
    dependencies.push({
      name,
      version: String(version),
      type: "devDependency",
    });
  }

  dependencies.sort((a, b) => a.name.localeCompare(b.name));

  return dependencies;
}
