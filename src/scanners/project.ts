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

    if ("express" in dependencies) framework = "Express";
    else if ("next" in dependencies) framework = "Next.js";
    else if ("@nestjs/core" in dependencies) framework = "NestJS";
    else if ("fastify" in dependencies) framework = "Fastify";
    else if ("react" in dependencies) framework = "React";
    if ("typescript" in dependencies) language = "TypeScript";
  }

  if (fs.existsSync(path.join(projectPath, "package-lock.json")))
    packageManager = "npm";
  else if (fs.existsSync(path.join(projectPath, "pnpm-lock.yaml")))
    packageManager = "pnpm";
  else if (fs.existsSync(path.join(projectPath, "yarn.lock")))
    packageManager = "yarn";

  let sourceDirectory = "src";

  if (!fs.existsSync(path.join(projectPath, "src"))) sourceDirectory = ".";

  return {
    name,
    framework,
    language,
    packageManager,
    hasDocker: fs.existsSync(path.join(projectPath, "Dockerfile")),
    hasEnv: fs.existsSync(path.join(projectPath, ".env")),
    hasGit: fs.existsSync(path.join(projectPath, ".git")),
    sourceDirectory,
  };
}
