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

  //AI guided me to understand concepts of ts-morph and fast-glob
  //Not AI generated code but it did help in some parts package related parts

  for (const file of files) {
    const source = project.addSourceFileAtPath(file);
    const calls = source.getDescendantsOfKind(SyntaxKind.CallExpression);

    for (const call of calls) {
      const expression = call.getExpression();

      const property = expression.asKind(SyntaxKind.PropertyAccessExpression);
      if (!property) continue;

      const method = property.getName();

      if (!METHODS.includes(method)) continue;

      const object = property.getExpression().getText();

      if (object !== "app" && object !== "router") continue;

      const args = call.getArguments();

      if (args.length === 0) continue;

      const first = args[0];
      const StringLiteral = first.asKind(SyntaxKind.StringLiteral);

      if (!StringLiteral) continue;

      routes.push({
        method: method.toUpperCase(),
        path: StringLiteral.getLiteralValue(),
        file: path.relative(projectPath, file),
      });
    }
  }

  return routes;
}
