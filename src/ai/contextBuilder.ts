import { normalizePath } from "../utils/path.js";

export interface SecurityContext {
  projectOverview: string;
  attackSurfaceSummary: string;
  rankedExploitPaths: string[];
  exposedSecretsInventory: string[];
  criticalRoutes: string[];
  dependencyRiskSummary: string[];
  formattedContextPrompt: string;
}

const MAX_CONTEXT_CHARACTERS = 100000;

export function truncateContextSafely(promptText: string, maxChars = MAX_CONTEXT_CHARACTERS): string {
  if (maxChars <= 0) return "";
  if (promptText.length <= maxChars) return promptText;

  const notice = "\n\n... [SENTINEL CONTEXT BUDGET CEILING EXCEEDED: REMAINING AST DATA TRUNCATED SAFELY] ...\n";
  if (maxChars <= notice.length) {
    return notice.slice(0, maxChars);
  }

  const cutoff = maxChars - notice.length;
  return promptText.slice(0, cutoff) + notice;
}

export function buildSecurityContext(analysis: any): SecurityContext {
  const project = analysis?.project || { name: "Unknown", type: "Node.js" };
  const routes = Array.isArray(analysis?.routes) ? analysis.routes : [];
  const dependencies = Array.isArray(analysis?.dependencies)
    ? analysis.dependencies
    : [];
  const secrets = Array.isArray(analysis?.secrets) ? analysis.secrets : [];
  const exploitPaths = Array.isArray(analysis?.exploitPaths)
    ? analysis.exploitPaths
    : [];

  const projectOverview = `Project Name: ${project.name || "App"} | Type: ${project.type || "TypeScript/Node.js"} | Total Analyzed Routes: ${routes.length}`;

  const criticalRoutes = routes
    .map((r: any) => `${r.method} ${r.path} (${normalizePath(r.file)})`)
    .slice(0, 25);

  const exposedSecretsInventory = secrets.map(
    (s: any) =>
      `Secret Type: [${s.type}] at ${normalizePath(s.file)}:${s.line}`,
  );

  const prodDeps = dependencies.filter((d: any) => d.type === "dependency");
  const dependencyRiskSummary = prodDeps
    .slice(0, 20)
    .map((d: any) => `${d.name}@${d.version}`);

  const rankedExploitPaths = exploitPaths.map((p: any) => {
    const entryFile = normalizePath(p.entryNode?.filePath || "");
    const route = p.entryNode?.metadata?.path || "Endpoint";
    const method = p.entryNode?.metadata?.method || "HTTP";
    return `[${p.riskSeverity}] ${p.title} -> Chain: (${method} ${route} in ${entryFile}) -> Risk: ${p.description}`;
  });

  const attackSurfaceSummary = `Identified ${routes.length} HTTP API endpoints, ${secrets.length} hardcoded secret patterns, ${prodDeps.length} runtime dependencies, and ${exploitPaths.length} multi-hop attack graph exploit vectors.`;

  const rawFormattedPrompt = `
══════════════════════════════════════════════════════════════════════
SENTINEL HIGH-DENSITY SECURITY CONTEXT PAYLOAD
══════════════════════════════════════════════════════════════════════

PROJECT OVERVIEW:
${projectOverview}

ATTACK SURFACE & REPOSITORY METRICS:
${attackSurfaceSummary}

RANKED ATTACK GRAPH EXPLOIT PATHS (${exploitPaths.length} Active Vectors):
${
  rankedExploitPaths.length > 0
    ? rankedExploitPaths.map((path: string, i: number) => `  ${i + 1}. ${path}`).join("\n")
    : "  - No multi-hop attack graph exploit paths detected."
}

EXPOSED SECRETS INVENTORY (${secrets.length} Detected):
${
  exposedSecretsInventory.length > 0
    ? exposedSecretsInventory.map((sec: string, i: number) => `  ${i + 1}. ${sec}`).join("\n")
    : "  - No regex secret patterns detected."
}

DISCOVERED CRITICAL HTTP API ROUTES (${routes.length} Total):
${
  criticalRoutes.length > 0
    ? criticalRoutes.map((r: string, i: number) => `  ${i + 1}. ${r}`).join("\n")
    : "  - No HTTP routes declared in AST."
}

RUNTIME DEPENDENCY TREE (${prodDeps.length} Production Dependencies):
${
  dependencyRiskSummary.length > 0
    ? dependencyRiskSummary.map((dep: string, i: number) => `  ${i + 1}. ${dep}`).join("\n")
    : "  - No production package dependencies listed."
}
══════════════════════════════════════════════════════════════════════
`;

  const formattedContextPrompt = truncateContextSafely(rawFormattedPrompt);

  return {
    projectOverview,
    attackSurfaceSummary,
    rankedExploitPaths,
    exposedSecretsInventory,
    criticalRoutes,
    dependencyRiskSummary,
    formattedContextPrompt,
  };
}
