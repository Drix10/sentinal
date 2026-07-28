import type { Finding } from "../findings/findingStore";
import { normalizePath } from "../utils/path";

export interface SarifLog {
  $schema: string;
  version: string;
  runs: Array<{
    tool: {
      driver: {
        name: string;
        version: string;
        informationUri: string;
        rules: Array<{
          id: string;
          name: string;
          shortDescription: { text: string };
          fullDescription: { text: string };
          help: { text: string; markdown: string };
          properties: {
            tags: string[];
            "security-severity": string;
            [key: string]: any;
          };
        }>;
      };
    };
    originalUriBaseIds?: Record<string, { uri: string }>;
    results: Array<{
      ruleId: string;
      level: "error" | "warning" | "note";
      message: { text: string };
      locations: Array<{
        physicalLocation: {
          artifactLocation: { uri: string; uriBaseId?: string };
          region: { startLine: number };
        };
      }>;
    }>;
  }>;
}

export function generateSarifReport(
  findings: Finding[],
  projectRoot?: string,
  version = "1.0.7",
): SarifLog {
  const rulesMap = new Map<string, any>();
  const results: any[] = [];

  for (const f of findings) {
    if (!rulesMap.has(f.ruleId)) {
      const secSev =
        f.severity === "CRITICAL"
          ? "9.0"
          : f.severity === "HIGH"
            ? "7.0"
            : f.severity === "MEDIUM"
              ? "5.0"
              : "3.0";

      rulesMap.set(f.ruleId, {
        id: f.ruleId,
        name: f.title,
        shortDescription: { text: f.title },
        fullDescription: { text: f.description },
        help: {
          text: `${f.description}\n\nRecommendation: ${f.recommendation}`,
          markdown: `### ${f.title}\n\n${f.description}\n\n**Recommendation:**\n${f.recommendation}`,
        },
        properties: {
          tags: ["security", f.owaspCategory || "OWASP"],
          "security-severity": secSev,
        },
      });
    }

    const level =
      f.severity === "CRITICAL" || f.severity === "HIGH"
        ? "error"
        : f.severity === "MEDIUM"
          ? "warning"
          : "note";

    // Standardize URI format for GitHub Security SARIF compatibility
    let relUri = normalizePath(f.evidence.file || "package.json");
    if (relUri.startsWith("./")) relUri = relUri.slice(2);
    if (relUri.startsWith("/")) relUri = relUri.slice(1);

    const lineNum = Math.max(1, typeof f.evidence.line === "number" ? f.evidence.line : 1);

    results.push({
      ruleId: f.ruleId,
      level,
      message: { text: `${f.title}: ${f.description.slice(0, 300)}` },
      locations: [
        {
          physicalLocation: {
            artifactLocation: {
              uri: relUri,
              uriBaseId: "PROJECTROOT",
            },
            region: { startLine: lineNum },
          },
        },
      ],
    });
  }

  const baseRootUri = projectRoot
    ? normalizePath(projectRoot).endsWith("/")
      ? normalizePath(projectRoot)
      : `${normalizePath(projectRoot)}/`
    : "file:///";

  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "Sentinel AI Security Platform",
            version,
            informationUri: "https://github.com/Drix10/sentinal",
            rules: Array.from(rulesMap.values()),
          },
        },
        originalUriBaseIds: {
          PROJECTROOT: {
            uri: baseRootUri,
          },
        },
        results,
      },
    ],
  };
}
