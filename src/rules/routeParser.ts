import path from "node:path";
import fg from "fast-glob";
import { Project, SyntaxKind, type SourceFile } from "ts-morph";
import { normalizePath } from "../utils/path";

export const HTTP_METHODS = [
  "get",
  "post",
  "put",
  "patch",
  "delete",
  "options",
  "head",
  "connect",
  "trace",
  "all",
  "use",
];

export interface ExtractedRoute {
  method: string;
  path: string;
  file: string;
  startLine: number;
  endLine: number;
}

export function extractRoutesFromSource(
  source: SourceFile,
  relPath: string,
): ExtractedRoute[] {
  const routes: ExtractedRoute[] = [];
  const normalizedFile = normalizePath(relPath);
  const calls = source.getDescendantsOfKind(SyntaxKind.CallExpression);

  for (const call of calls) {
    const expression = call.getExpression();
    const property = expression.asKind(SyntaxKind.PropertyAccessExpression);
    if (!property) continue;

    const method = property.getName().toLowerCase();
    if (!HTTP_METHODS.includes(method)) continue;

    const args = call.getArguments();
    if (args.length === 0) continue;

    const first = args[0];
    let pathStr: string | null = null;

    const stringLiteral = first.asKind(SyntaxKind.StringLiteral);
    if (stringLiteral) {
      pathStr = stringLiteral.getLiteralValue();
    } else {
      const noSub = first.asKind(SyntaxKind.NoSubstitutionTemplateLiteral);
      if (noSub) {
        pathStr = noSub.getLiteralValue();
      } else {
        const templateExpr = first.asKind(SyntaxKind.TemplateExpression);
        if (templateExpr) {
          pathStr = templateExpr.getText();
        }
      }
    }

    if (!pathStr || !pathStr.startsWith("/")) continue;

    routes.push({
      method: method.toUpperCase(),
      path: pathStr,
      file: normalizedFile,
      startLine: call.getStartLineNumber(),
      endLine: call.getEndLineNumber(),
    });
  }

  return routes;
}

export async function scanRoutesShared(
  projectPath: string,
): Promise<ExtractedRoute[]> {
  const files = await fg(
    ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
    {
      cwd: projectPath,
      absolute: true,
      ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.next/**"],
    },
  );

  if (files.length === 0) return [];

  const project = new Project({
    compilerOptions: { allowJs: true },
    skipAddingFilesFromTsConfig: true,
  });

  const routes: ExtractedRoute[] = [];

  for (const file of files) {
    let source: SourceFile | undefined;
    try {
      const relPath = normalizePath(path.relative(projectPath, file));
      source = project.addSourceFileAtPath(file);
      const extracted = extractRoutesFromSource(source, relPath);
      routes.push(...extracted);
    } catch {
      // Ignore unparseable individual files gracefully
    } finally {
      if (source) {
        project.removeSourceFile(source);
      }
    }
  }

  return routes;
}
