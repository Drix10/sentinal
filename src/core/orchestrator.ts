import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import type { Ora } from "ora";
import { scanProject } from "../rules/project";
import { scanDependencies } from "../rules/dependencies";
import { scanSecrets } from "../rules/secrets";
import { generateSecurityReport } from "../ai/llm";
import { TypeScriptPlugin } from "../plugins/typescript";
import { KnowledgeGraph } from "../graph/knowledgeGraph";
import { AttackGraphEngine } from "../graph/attackGraph";
import { FindingStore, type FindingSeverity } from "../findings/findingStore";
import { eventBus } from "../events/eventBus";
import type { RouteInfo } from "../types";
import { generateSarifReport } from "../reporters/sarifReporter";
import { normalizePath } from "../utils/path";
import {
  colors,
  renderScoreBadge,
  renderBox,
  renderIRSummary,
  renderGraphSummary,
  renderNextSteps,
  renderCustomTable,
} from "../ui/render";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function runAttack(projectPath: string, spinner: Ora, options?: { format?: string; output?: string }) {
  const startTime = Date.now();
  const normalizedProjectPath = normalizePath(projectPath);
  const knowledgeGraph = new KnowledgeGraph();
  const findingStore = new FindingStore();

  findingStore.loadFromProject(normalizedProjectPath);

  eventBus.resetListeners();

  eventBus.onEvent("project:indexed", (p) => {
    spinner.text = colors.purple(`Indexed ${p.project.files.size} source AST files`);
  });

  eventBus.onEvent("route:discovered", (r) => {
    spinner.text = colors.dim(`Discovered route: ${r.route.method} ${r.route.path}`);
  });

  eventBus.onEvent("dependency:parsed", (d) => {
    spinner.text = colors.dim(`Mapped ${d.dependencies.length} package dependencies`);
  });

  eventBus.onEvent("secret:detected", (s) => {
    spinner.warn(
      colors.critical(` Secret Detected: Exposing ${s.secret.type} @ ${s.secret.file}:${s.secret.line}`),
    );
    spinner.start();
  });

  eventBus.onEvent("graph:knowledge_updated", (g) => {
    spinner.text = colors.brand(`Knowledge Graph: ${g.nodeCount} nodes, ${g.edgeCount} edges`);
  });

  eventBus.onEvent("graph:attack_generated", (a) => {
    spinner.warn(
      colors.high(` Exploit Paths Synthesized: ${a.edgeCount} attack vectors`),
    );
    spinner.start();
  });

  spinner.text = colors.brand(`Indexing repository: ${normalizedProjectPath}`);
  const project = await scanProject(normalizedProjectPath);
  await delay(350);
  spinner.succeed(colors.low("Project Detected & Topology Analyzed"));
  console.log();

  renderCustomTable(
    [
      { key: "property", label: "PROPERTY", width: 22 },
      { key: "value", label: "VALUE / METADATA", width: 49 },
    ],
    [
      { property: "Project Name", value: project.name },
      { property: "Framework", value: project.framework },
      { property: "Language", value: project.language },
      { property: "Package Manager", value: project.packageManager },
      { property: "Source Directory", value: project.sourceDirectory },
      { property: "Docker Configured", value: project.hasDocker ? "Yes" : "No" },
      { property: "Env Configured", value: project.hasEnv ? "Yes" : "No" },
    ],
    colors.brand,
  );
  console.log();

  const tsPlugin = new TypeScriptPlugin(normalizedProjectPath);
  const irProject = await tsPlugin.parseProject(project.name);
  eventBus.emitEvent("project:indexed", { project: irProject });

  renderIRSummary(irProject.files.size, irProject.files.size);

  spinner.start(colors.brand("Discovering HTTP routes & middleware..."));
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

  await delay(350);
  spinner.succeed(colors.low(`Discovered ${routes.length} HTTP API routes`));
  if (routes.length > 0) {
    renderCustomTable(
      [
        { key: "method", label: "METHOD", width: 8 },
        { key: "path", label: "ROUTE PATH", width: 38 },
        { key: "file", label: "SOURCE FILE", width: 22 },
      ],
      routes.slice(0, 10),
      colors.purple,
    );
    console.log();
  }

  spinner.start(colors.brand("Scanning project dependencies & SCA tree..."));
  const dependencies = await scanDependencies(normalizedProjectPath);
  await delay(350);
  spinner.succeed(colors.low(`Found ${dependencies.length} package dependencies`));
  if (dependencies.length > 0) {
    renderCustomTable(
      [
        { key: "name", label: "PACKAGE NAME", width: 36 },
        { key: "version", label: "VERSION", width: 16 },
        { key: "type", label: "SCOPE", width: 16 },
      ],
      dependencies.slice(0, 15),
      colors.low,
    );
    console.log();
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

  spinner.start(colors.brand("Scanning source code for exposed secrets..."));
  const secrets = await scanSecrets(normalizedProjectPath);
  await delay(350);
  spinner.succeed(colors.low(`Found ${secrets.length} secret patterns`));
  if (secrets.length > 0) {
    renderCustomTable(
      [
        { key: "type", label: "SECRET TYPE", width: 24 },
        { key: "value", label: "MASKED VALUE", width: 18 },
        { key: "file", label: "FILE LOCATION", width: 26 },
      ],
      secrets.slice(0, 15),
      colors.critical,
    );
    console.log();
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

  renderGraphSummary(
    knowledgeGraph.getAllNodes().length,
    knowledgeGraph.getAllEdges().length,
    exploitPaths.length,
  );

  const analysis = {
    project,
    routes,
    dependencies,
    secrets,
    exploitPaths,
  };

  spinner.start(colors.brand("Synthesizing AI Security Audit Report..."));
  const reportData = await generateSecurityReport(analysis);
  await delay(400);
  spinner.succeed(colors.low("Security Report Synthesized Successfully!"));
  console.log();

  if (reportData.findings && Array.isArray(reportData.findings)) {
    for (const f of reportData.findings) {
      const sevUpper = String(f.severity || "MEDIUM").toUpperCase();
      const validSeverity: FindingSeverity = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"].includes(sevUpper)
        ? (sevUpper as FindingSeverity)
        : "MEDIUM";

      const confRaw = typeof f.confidence === "number" ? f.confidence : 0.85;
      const cleanConf = confRaw > 1 ? confRaw / 100 : confRaw;

      // Filter out low-confidence AI noise (confidence < 0.50)
      if (cleanConf < 0.50) {
        continue;
      }

      let rawEvidenceFile = typeof f.evidence === "string" ? f.evidence : "package.json";
      const fileMatch = rawEvidenceFile.match(/\b([a-zA-Z0-9_\-\/\.]+\.(?:json|tsx|jsx|yaml|env|yml|ts|js|md))\b/i);
      if (fileMatch) {
        rawEvidenceFile = fileMatch[1];
      } else if (!fs.existsSync(path.resolve(normalizedProjectPath, rawEvidenceFile))) {
        rawEvidenceFile = "package.json";
      }

      let lineNum = 1;
      const absEvidenceFile = path.resolve(normalizedProjectPath, rawEvidenceFile);
      if (fs.existsSync(absEvidenceFile)) {
        try {
          const fileLines = fs.readFileSync(absEvidenceFile, "utf8").split("\n");
          const searchKey = f.title || f.owaspCategory || "";
          const foundIdx = fileLines.findIndex((line) =>
            searchKey.split(" ").some((word: string) => word.length > 4 && line.toLowerCase().includes(word.toLowerCase())),
          );
          if (foundIdx !== -1) {
            lineNum = foundIdx + 1;
          }
        } catch {
          // Default to line 1
        }
      }

      findingStore.createFinding({
        ruleId: `AI-${(f.owaspCategory || "SECURITY").toUpperCase().replace(/[^A-Z0-9]/g, "_")}`,
        title: f.title || "AI Vulnerability Finding",
        severity: validSeverity,
        confidence: cleanConf,
        owaspCategory: f.owaspCategory || "A05:2021-Security Misconfiguration",
        cweId: f.cweId || "CWE-200",
        description: `${f.whyDangerous || ""}\n\nAttack Scenario:\n${f.attackScenario || ""}`.trim(),
        evidence: {
          file: rawEvidenceFile,
          line: lineNum,
        },
        recommendation: f.recommendation || "Review and secure configuration.",
      });
    }
  }

  console.log(renderScoreBadge(reportData.securityScore || 75));
  renderBox("[+] EXECUTIVE SUMMARY", reportData.executiveSummary, colors.brand);
  console.log();

  if (reportData.attackSurface && reportData.attackSurface.length > 0) {
    renderBox(
      "[+] ATTACK SURFACE DISCOVERED",
      reportData.attackSurface.map((item: string, i: number) => `${i + 1}. ${item}`).join("\n"),
      colors.purple,
    );
    console.log();
  }

  if (reportData.findings && reportData.findings.length > 0) {
    console.log(colors.brand(" [+] IDENTIFIED VULNERABILITIES & ATTACK VECTORS:"));
    for (const f of reportData.findings) {
      const severityColor =
        f.severity === "CRITICAL"
          ? colors.critical
          : f.severity === "HIGH"
            ? colors.high
            : f.severity === "MEDIUM"
              ? colors.medium
              : colors.low;

      const confRaw = typeof f.confidence === "number" ? f.confidence : 0.9;
      const cleanConf = confRaw > 1 ? confRaw / 100 : confRaw;

      renderBox(
        `${severityColor(`[${f.severity}]`)} ${f.title}`,
        `OWASP: ${f.owaspCategory}  |  Confidence: ${(cleanConf * 100).toFixed(0)}%\nWhy Dangerous: ${f.whyDangerous}\n\nAttack Scenario:\n${f.attackScenario}\n\nRecommendation:\n${f.recommendation}`,
        severityColor,
      );
      console.log();
    }
  }

  if (reportData.recommendations && reportData.recommendations.length > 0) {
    renderBox(
      "[+] ORDERED RECOMMENDATIONS & REMEDIATION PRIORITIES",
      reportData.recommendations.map((rec: string, i: number) => `${i + 1}. ${rec}`).join("\n"),
      colors.low,
    );
    console.log();
  }

  const allFindings = findingStore.getAllFindings();
  let savedFile: string | undefined;

  if (allFindings.length > 0) {
    savedFile = findingStore.saveToProject(normalizedProjectPath);

    console.log(colors.brand(" [+] FINDING LIFECYCLE STORE SUMMARY"));
    renderCustomTable(
      [
        { key: "id", label: "ID", width: 13 },
        { key: "severity", label: "SEVERITY", width: 10 },
        { key: "title", label: "VULNERABILITY TITLE", width: 23 },
        { key: "location", label: "LOCATION", width: 10 },
        { key: "confidence", label: "CONF.", width: 6 },
      ],
      allFindings.map((f) => {
        const rawFile = f.evidence.file || "package.json";
        const truncatedFile = rawFile.length > 14 ? rawFile.slice(0, 11) + "..." : rawFile;
        const conf = f.confidence > 1 ? f.confidence / 100 : f.confidence;
        return {
          id: f.id,
          severity: f.severity,
          title: f.title,
          location: `${truncatedFile}:${f.evidence.line}`,
          confidence: `${(conf * 100).toFixed(0)}%`,
        };
      }),
      colors.brand,
    );
    console.log();
  }

  const firstId = allFindings.length > 0 ? allFindings[0].id : undefined;
  renderNextSteps(firstId, savedFile);

  // SARIF / JSON Export Handling
  if (options?.format && options.format !== "table") {
    const outPath = options.output
      ? path.resolve(normalizedProjectPath, options.output)
      : path.join(normalizedProjectPath, `.sentinel/report.${options.format}`);
    const parentDir = path.dirname(outPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    if (options.format === "sarif") {
      const sarifData = generateSarifReport(allFindings, normalizedProjectPath);
      fs.writeFileSync(outPath, JSON.stringify(sarifData, null, 2), "utf8");
      console.log(colors.low(` ✔ SARIF 2.1.0 security report saved to: ${outPath}`));
    } else if (options.format === "json") {
      fs.writeFileSync(outPath, JSON.stringify(allFindings, null, 2), "utf8");
      console.log(colors.low(` ✔ JSON security findings saved to: ${outPath}`));
    }
  }

  eventBus.emitEvent("scan:completed", {
    findingCount: allFindings.length,
    durationMs: Date.now() - startTime,
  });
}
