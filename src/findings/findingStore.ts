import crypto from "node:crypto";

export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";

export interface FindingEvidence {
  file: string;
  line: number;
  snippet?: string;
  routePath?: string;
  httpMethod?: string;
  secretType?: string;
  cveId?: string;
}

export interface Finding {
  id: string;
  uuid: string;
  ruleId: string;
  title: string;
  severity: FindingSeverity;
  confidence: number;
  owaspCategory: string;
  cweId?: string;
  description: string;
  evidence: FindingEvidence;
  recommendation: string;
  detectedAt: string;
}

export class FindingStore {
  private findings: Map<string, Finding> = new Map();
  private idCounter = 100;

  public createFinding(
    data: Omit<Finding, "id" | "uuid" | "detectedAt">,
  ): Finding {
    const existing = Array.from(this.findings.values()).find(
      (f) =>
        f.ruleId === data.ruleId &&
        f.evidence.file === data.evidence.file &&
        f.evidence.line === data.evidence.line,
    );

    if (existing) return existing;

    const id = `FINDING-${this.idCounter++}`;
    const uuid = crypto.randomUUID();
    const detectedAt = new Date().toISOString();

    const finding: Finding = {
      ...data,
      id,
      uuid,
      detectedAt,
    };

    this.findings.set(id, finding);
    return finding;
  }

  public getFinding(id: string): Finding | undefined {
    return this.findings.get(id);
  }

  public getAllFindings(): Finding[] {
    return Array.from(this.findings.values());
  }

  public getFindingsBySeverity(severity: FindingSeverity): Finding[] {
    return Array.from(this.findings.values()).filter(
      (f) => f.severity === severity,
    );
  }

  public clear(): void {
    this.findings.clear();
    this.idCounter = 100;
  }
}
