import { SyntaxKind, type SourceFile } from "ts-morph";
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
