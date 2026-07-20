import path from "node:path";
import fg from "fast-glob";
import { Project, SyntaxKind } from "ts-morph";

import type { RouteInfo } from "../types";

const METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
  "connect",
  "trace",
];

export async function scanRoutes(projectPath: string): Promise<RouteInfo[]> {
  const files = await fg(["**/*.ts", "**/*.js"], {
    cwd: projectPath,
    absolute: true,
    ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
  });

  const project = new Project();
  const routes: RouteInfo[] = [];

  for (const file of files) {
    const source = project.addSourceFileAtPath(file);
    const calls = source.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const call of calls) {
        const expression = call.getExpression();
        
    }
  }


}
