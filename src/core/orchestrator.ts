import chalk from "chalk";
import type { Ora } from "ora";
import { scanProject } from "../rules/project";
import { scanDependencies } from "../rules/dependencies";
import { scanSecrets } from "../rules/secrets";
import { generateSecurityReport } from "../ai/llm";
import { TypeScriptPlugin } from "../plugins/typescript";
import { KnowledgeGraph } from "../graph/knowledgeGraph";
import { AttackGraphEngine } from "../graph/attackGraph";
import { FindingStore } from "../findings/findingStore";
import { eventBus } from "../events/eventBus";
import type { RouteInfo } from "../types";
import { normalizePath } from "../utils/path";

export async function runAttack(projectPath: string, spinner: Ora) {
  const startTime = Date.now();
  const normalizedProjectPath = normalizePath(projectPath);
  const knowledgeGraph = new KnowledgeGraph();
  const findingStore = new FindingStore();

  spinner.text = `Scanning ${normalizedProjectPath}`;
  const project = await scanProject(normalizedProjectPath);
  spinner.succeed("Project Detected");
  console.log();
  console.table(project);

  // Compile project into Sentinel IR using TypeScript Plugin
  const tsPlugin = new TypeScriptPlugin(normalizedProjectPath);
  const irProject = await tsPlugin.parseProject(project.name);
  eventBus.emitEvent("project:indexed", { project: irProject });

  // Derive flat route list directly from irProject.files
  spinner.start("Discovering routes...");
  const routes: RouteInfo[] = [];

  for (const file of irProject.files.values()) {
    for (const irRoute of file.routes) {
      const normalizedRouteFile = normalizePath(irRoute.filePath);
      routes.push({
        method: irRoute.method,
        path: irRoute.path,
        file: normalizedRouteFile,
      });

      const routeId = `ROUTE-${irRoute.method}-${irRoute.path}`;
      knowledgeGraph.addNode({
        id: routeId,
        type: "ROUTE",
        label: `${irRoute.method} ${irRoute.path}`,
        filePath: normalizedRouteFile,
        lineNumber: irRoute.location.start.line,
        metadata: {
          method: irRoute.method,
          path: irRoute.path,
          location: irRoute.location,
        },
      });

      eventBus.emitEvent("route:discovered", {
        route: {
          ...irRoute,
          filePath: normalizedRouteFile,
        },
      });
    }
  }

  spinner.succeed(`Discovered ${routes.length} routes`);
  if (routes.length > 0) {
    console.table(routes.slice(0, 10));
  }

  // Scan Dependencies & Add to Knowledge Graph
  spinner.start("Scanning dependencies...");
  const dependencies = await scanDependencies(normalizedProjectPath);
  spinner.succeed(`Found ${dependencies.length} dependencies`);
  if (dependencies.length > 0) {
    console.table(dependencies.slice(0, 15));
  }
  eventBus.emitEvent("dependency:parsed", { dependencies });

  for (const d of dependencies) {
    const depNodeId = `DEP-${d.name}`;
    knowledgeGraph.addNode({
      id: depNodeId,
      type: "DEPENDENCY",
      label: `${d.name}@${d.version}`,
      metadata: { name: d.name, version: d.version, type: d.type },
    });

    for (const r of routes) {
      const routeNodeId = `ROUTE-${r.method}-${r.path}`;
      knowledgeGraph.addEdge({
        sourceId: routeNodeId,
        targetId: depNodeId,
        type: "USES_DEPENDENCY",
      });
    }
  }

  // Scan Secrets & Add to Knowledge Graph
  spinner.start("Scanning secrets...");
  const secrets = await scanSecrets(normalizedProjectPath);
  spinner.succeed(`Found ${secrets.length} potential secrets`);
  if (secrets.length > 0) {
    console.table(secrets.slice(0, 15));
  }

  for (const s of secrets) {
    const normalizedSecretFile = normalizePath(s.file);
    const secretId = `SECRET-${s.type}-${normalizedSecretFile}-${s.line}`;
    knowledgeGraph.addNode({
      id: secretId,
      type: "SECRET",
      label: s.type,
      filePath: normalizedSecretFile,
      lineNumber: s.line,
      metadata: { secretType: s.type, value: s.value },
    });
    eventBus.emitEvent("secret:detected", {
      secret: {
        ...s,
        file: normalizedSecretFile,
      },
    });

    for (const r of routes) {
      const normalizedRouteFile = normalizePath(r.file);
      const rootDir = normalizedRouteFile.split("/")[0];
      if (
        normalizedRouteFile === normalizedSecretFile ||
        (rootDir && normalizedSecretFile.startsWith(rootDir))
      ) {
        const routeNodeId = `ROUTE-${r.method}-${r.path}`;
        knowledgeGraph.addEdge({
          sourceId: routeNodeId,
          targetId: secretId,
          type: "READS_SECRET",
        });
      }
    }

    findingStore.createFinding({
      ruleId: `SECRET-EXPOSED-${s.type.toUpperCase().replace(/\s+/g, "_")}`,
      title: `Hardcoded Secret Detected: ${s.type}`,
      severity: "HIGH",
      confidence: 0.95,
      owaspCategory: "A07:2021-Identification and Authentication Failures",
      cweId: "CWE-798",
      description: `Potential hardcoded secret of type '${s.type}' detected in file ${normalizedSecretFile} at line ${s.line}.`,
      evidence: {
        file: normalizedSecretFile,
        line: s.line,
        secretType: s.type,
      },
      recommendation:
        "Remove hardcoded secret credentials and use environment variables or a secure secrets vault.",
    });
  }

  eventBus.emitEvent("graph:knowledge_updated", {
    nodeCount: knowledgeGraph.getAllNodes().length,
    edgeCount: knowledgeGraph.getAllEdges().length,
  });

  // Synthesize Exploit Paths with AttackGraphEngine
  const attackEngine = new AttackGraphEngine(knowledgeGraph);
  const exploitPaths = attackEngine.synthesizeExploitPaths();

  if (exploitPaths.length > 0) {
    eventBus.emitEvent("graph:attack_generated", {
      nodeCount: knowledgeGraph.getAllNodes().length,
      edgeCount: exploitPaths.length,
    });

    for (const path of exploitPaths) {
      findingStore.createFinding({
        ruleId: `EXPLOIT-PATH-${path.id}`,
        title: path.title,
        severity: path.riskSeverity,
        confidence: 0.9,
        owaspCategory: "A01:2021-Broken Access Control",
        cweId: "CWE-284",
        description: path.description,
        evidence: {
          file: normalizePath(path.entryNode.filePath || ""),
          line: path.entryNode.lineNumber || 1,
          routePath: path.entryNode.metadata?.path,
          httpMethod: path.entryNode.metadata?.method,
        },
        recommendation:
          "Implement proper authentication guards and middleware authorization on exposed endpoints.",
      });
    }
  }

  const analysis = {
    project,
    routes,
    dependencies,
    secrets,
    exploitPaths,
  };

  spinner.start("Creating Security Report...");
  const report = await generateSecurityReport(analysis);
  spinner.succeed("Security report generated.");
  console.log(report);

  eventBus.emitEvent("scan:completed", {
    findingCount: findingStore.getAllFindings().length,
    durationMs: Date.now() - startTime,
  });
}
