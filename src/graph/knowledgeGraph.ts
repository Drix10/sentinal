export type NodeType =
  | "ROUTE"
  | "MIDDLEWARE"
  | "CONTROLLER"
  | "DATABASE_QUERY"
  | "SECRET"
  | "DEPENDENCY"
  | "CONFIG";

export type EdgeType =
  | "APPLIES_MIDDLEWARE"
  | "CALLS_HANDLER"
  | "EXECUTES_QUERY"
  | "READS_SECRET"
  | "USES_DEPENDENCY"
  | "TAINT_FLOWS_TO";

export interface KnowledgeNode {
  id: string;
  type: NodeType;
  label: string;
  filePath?: string;
  lineNumber?: number;
  metadata: Record<string, any>;
}

export interface KnowledgeEdge {
  sourceId: string;
  targetId: string;
  type: EdgeType;
  metadata?: Record<string, any>;
}

export class KnowledgeGraph {
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: KnowledgeEdge[] = [];

  public addNode(node: KnowledgeNode): void {
    this.nodes.set(node.id, node);
  }

  public getNode(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  public addEdge(edge: KnowledgeEdge): void {
    const exists = this.edges.some(
      (e) =>
        e.sourceId === edge.sourceId &&
        e.targetId === edge.targetId &&
        e.type === edge.type,
    );
    if (!exists) {
      this.edges.push(edge);
    }
  }

  public getNodesByType(type: NodeType): KnowledgeNode[] {
    return Array.from(this.nodes.values()).filter((n) => n.type === type);
  }

  public getOutgoingEdges(nodeId: string): KnowledgeEdge[] {
    return this.edges.filter((e) => e.sourceId === nodeId);
  }

  public getIncomingEdges(nodeId: string): KnowledgeEdge[] {
    return this.edges.filter((e) => e.targetId === nodeId);
  }

  public getAllNodes(): KnowledgeNode[] {
    return Array.from(this.nodes.values());
  }

  public getAllEdges(): KnowledgeEdge[] {
    return [...this.edges];
  }

  public clear(): void {
    this.nodes.clear();
    this.edges = [];
  }
}
