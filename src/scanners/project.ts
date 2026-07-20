import fs from "node:fs";
import path from "node:path";

import type { ProjectInfo } from "../types";

export async function scanProject(projectPath: string): Promise<ProjectInfo> {
  const packageFile = path.join(projectPath, "package.json");

  let framework = "Unknown";
  let language = "Javascript";
  let packageManager = "Unknown";

  let name = path.basename(projectPath);

  if (fs.existsSync(packageFile)) {
    const pkg = JSON.parse(fs.readFileSync(packageFile, "utf8"));

    name = pkg.name ?? name;

    const dependencies = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    };

    if ("express" in dependencies) framework = "Express"
  }
}
