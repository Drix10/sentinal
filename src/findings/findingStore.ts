import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { normalizePath } from "../utils/path";

export type FindingSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
export type FindingStatus = "OPEN" | "IGNORED" | "FIXED";

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
  status: FindingStatus;
  ignoreReason?: string;
  detectedAt: string;
}

export class FindingStore {
  private findings: Map<string, Finding> = new Map();
  private idCounter = 100;

  public createFinding(
    data: Omit<Finding, "id" | "uuid" | "detectedAt" | "status"> & {
      status?: FindingStatus;
    },
  ): Finding {
    const normalizedFile = normalizePath(data.evidence.file);

    const existing = Array.from(this.findings.values()).find(
      (f) =>
        f.ruleId === data.ruleId &&
        f.title === data.title &&
        normalizePath(f.evidence.file) === normalizedFile &&
        f.evidence.line === data.evidence.line,
    );

    if (existing) return existing;

    const id = `FINDING-${this.idCounter++}`;
    const uuid = crypto.randomUUID();
    const detectedAt = new Date().toISOString();

    const finding: Finding = {
      ...data,
      evidence: {
        ...data.evidence,
        file: normalizedFile,
      },
      id,
      uuid,
      status: data.status || "OPEN",
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

  public saveToProject(projectPath: string): string {
    const sentinelDir = path.join(projectPath, ".sentinel");
    if (!fs.existsSync(sentinelDir)) {
      fs.mkdirSync(sentinelDir, { recursive: true });
    }
    const findingsFile = path.join(sentinelDir, "findings.json");
    const data = Array.from(this.findings.values());
    fs.writeFileSync(findingsFile, JSON.stringify(data, null, 2), "utf8");
    return findingsFile;
  }

  public loadFromProject(projectPath: string): boolean {
    const findingsFile = path.join(projectPath, ".sentinel", "findings.json");
    if (!fs.existsSync(findingsFile)) {
      return false;
    }
    try {
      const content = fs.readFileSync(findingsFile, "utf8");
      const list = JSON.parse(content);
      if (!Array.isArray(list)) return false;

      this.clear();
      let maxId = 99;

      for (const item of list) {
        if (item && item.id) {
          if (!item.uuid) {
            item.uuid = crypto.randomUUID();
          }
          if (!item.status) {
            item.status = "OPEN";
          }
          if (item.evidence && item.evidence.file) {
            item.evidence.file = normalizePath(item.evidence.file);
          }
          this.findings.set(item.id, item);
          const match = item.id.match(/^FINDING-(\d+)$/);
          if (match) {
            const num = parseInt(match[1], 10);
            if (!isNaN(num) && num > maxId) {
              maxId = num;
            }
          }
        }
      }

      this.idCounter = maxId + 1;
      return true;
    } catch {
      return false;
    }
  }

  public updateStatus(
    id: string,
    status: FindingStatus,
    reason?: string,
  ): boolean {
    const finding = this.findings.get(id);
    if (!finding) return false;
    finding.status = status;
    if (status === "IGNORED") {
      if (reason) finding.ignoreReason = reason;
    } else {
      delete finding.ignoreReason;
    }
    return true;
  }

  public clear(): void {
    this.findings.clear();
    this.idCounter = 100;
  }
}
