import { EventEmitter } from "node:events";
import type { IRProject, IRRoute } from "../ir/types";
import type { DependencyInfo, SecretFinding } from "../types";

export type SentinelEventType =
  | "project:indexed"
  | "route:discovered"
  | "secret:detected"
  | "dependency:parsed"
  | "graph:knowledge_updated"
  | "graph:attack_generated"
  | "scan:completed";

export interface ProjectIndexedPayload {
  project: IRProject;
}

export interface RouteDiscoveredPayload {
  route: IRRoute;
}

export interface SecretDetectedPayload {
  secret: SecretFinding;
}

export interface DependencyParsedPayload {
  dependencies: DependencyInfo[];
}

export interface GraphUpdatedPayload {
  nodeCount: number;
  edgeCount: number;
}

export interface ScanCompletedPayload {
  findingCount: number;
  durationMs: number;
}

export class SentinelEventBus extends EventEmitter {
  private static instance: SentinelEventBus;

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  public static getInstance(): SentinelEventBus {
    if (!SentinelEventBus.instance) {
      SentinelEventBus.instance = new SentinelEventBus();
    }
    return SentinelEventBus.instance;
  }

  public emitEvent(event: "project:indexed", payload: ProjectIndexedPayload): boolean;
  public emitEvent(event: "route:discovered", payload: RouteDiscoveredPayload): boolean;
  public emitEvent(event: "secret:detected", payload: SecretDetectedPayload): boolean;
  public emitEvent(event: "dependency:parsed", payload: DependencyParsedPayload): boolean;
  public emitEvent(event: "graph:knowledge_updated", payload: GraphUpdatedPayload): boolean;
  public emitEvent(event: "graph:attack_generated", payload: GraphUpdatedPayload): boolean;
  public emitEvent(event: "scan:completed", payload: ScanCompletedPayload): boolean;
  public emitEvent(event: SentinelEventType, payload: any): boolean {
    return this.emit(event, payload);
  }

  public onEvent(event: "project:indexed", listener: (payload: ProjectIndexedPayload) => void): this;
  public onEvent(event: "route:discovered", listener: (payload: RouteDiscoveredPayload) => void): this;
  public onEvent(event: "secret:detected", listener: (payload: SecretDetectedPayload) => void): this;
  public onEvent(event: "dependency:parsed", listener: (payload: DependencyParsedPayload) => void): this;
  public onEvent(event: "graph:knowledge_updated", listener: (payload: GraphUpdatedPayload) => void): this;
  public onEvent(event: "graph:attack_generated", listener: (payload: GraphUpdatedPayload) => void): this;
  public onEvent(event: "scan:completed", listener: (payload: ScanCompletedPayload) => void): this;
  public onEvent(event: SentinelEventType, listener: (payload: any) => void): this {
    return this.on(event, listener);
  }

  public offEvent(event: SentinelEventType, listener: (...args: any[]) => void): this {
    return this.off(event, listener);
  }

  public resetListeners(): void {
    this.removeAllListeners();
  }
}

export const eventBus = SentinelEventBus.getInstance();
