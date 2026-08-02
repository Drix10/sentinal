import path from "node:path";
import fg from "fast-glob";
import { Project, type SourceFile } from "ts-morph";
import type { IRFile, IRProject, IRRoute } from "../ir/types.js";
import { extractRoutesFromSource } from "../rules/routeParser.js";
import { normalizePath } from "../utils/path.js";

export class TypeScriptPlugin {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  public async parseProject(projectName: string): Promise<IRProject> {
    const files = await fg(
      ["**/*.ts", "**/*.js", "**/*.tsx", "**/*.jsx", "**/*.mjs", "**/*.cjs"],
      {
        cwd: this.projectPath,
        absolute: true,
        ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.next/**"],
      },
    );

    const irProject: IRProject = {
      name: projectName,
      rootPath: normalizePath(this.projectPath),
      language: "TypeScript",
      framework: "Node.js",
      packageManager: "npm",
      files: new Map(),
    };

    if (files.length === 0) return irProject;

    const tsProject = new Project({
      compilerOptions: { allowJs: true },
      skipAddingFilesFromTsConfig: true,
    });

    for (const file of files) {
      let source: SourceFile | undefined;
      try {
        const relPath = normalizePath(path.relative(this.projectPath, file));
        source = tsProject.addSourceFileAtPath(file);

        const extracted = extractRoutesFromSource(source, relPath);

        const irRoutes: IRRoute[] = extracted.map((r) => ({
          id: `ROUTE-${r.file}-${r.startLine}`,
          method: r.method as any,
          path: r.path,
          filePath: r.file,
          middlewareChain: [],
          location: {
            filePath: r.file,
            start: { line: r.startLine, column: 0 },
            end: { line: r.endLine, column: 0 },
          },
        }));

        const irFile: IRFile = {
          filePath: relPath,
          language: "TypeScript",
          functions: [],
          routes: irRoutes,
          variables: [],
          callSites: [],
          imports: [],
        };

        irProject.files.set(relPath, irFile);
      } catch {
      } finally {
        if (source) {
          tsProject.removeSourceFile(source);
        }
      }
    }

    return irProject;
  }
}
