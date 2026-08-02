import type { KnowledgeGraph, KnowledgeNode } from "./knowledgeGraph.js";

export interface ExploitPath {
  id: string;
  title: string;
  riskSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  entryNode: KnowledgeNode;
  targetNode: KnowledgeNode;
  nodesInChain: KnowledgeNode[];
  description: string;
}

export class AttackGraphEngine {
  private knowledgeGraph: KnowledgeGraph;

  constructor(knowledgeGraph: KnowledgeGraph) {
    this.knowledgeGraph = knowledgeGraph;
  }

  public synthesizeExploitPaths(): ExploitPath[] {
    const exploitPaths: ExploitPath[] = [];
    const routes = this.knowledgeGraph.getNodesByType("ROUTE");
    const sinks = [
      ...this.knowledgeGraph.getNodesByType("SECRET"),
      ...this.knowledgeGraph.getNodesByType("DATABASE_QUERY"),
    ];

    for (const route of routes) {
      const outgoing = this.knowledgeGraph.getOutgoingEdges(route.id);
      const hasAuthMiddleware = outgoing.some(
        (edge) =>
          edge.type === "APPLIES_MIDDLEWARE" &&
          edge.metadata?.isAuth === true,
      );

      if (!hasAuthMiddleware) {
        for (const sink of sinks) {
          const pathChain = this.findPathBFS(route.id, sink.id);
          if (pathChain && pathChain.length >= 2) {
            const isSecret = sink.type === "SECRET";
            const pathId = `PATH-${route.id}-${sink.id}`;
            const exists = exploitPaths.some((p) => p.id === pathId);

            if (!exists) {
              exploitPaths.push({
                id: pathId,
                title: isSecret
                  ? `Unauthenticated Route Accesses Secret (${sink.label})`
                  : `Unauthenticated Route Triggers Database Query (${sink.label})`,
                riskSeverity: isSecret ? "CRITICAL" : "HIGH",
                entryNode: route,
                targetNode: sink,
                nodesInChain: pathChain,
                description: `Route ${route.label} has no authentication guard and reaches ${sink.type} (${sink.label}) via a ${pathChain.length - 1}-hop execution path.`,
              });
            }
          }
        }
      }
    }

    return exploitPaths;
  }

  private findPathBFS(startId: string, endId: string): KnowledgeNode[] | null {
    const queue: string[][] = [[startId]];
    const visited = new Set<string>([startId]);

    while (queue.length > 0) {
      const currentPath = queue.shift()!;
      const lastId = currentPath[currentPath.length - 1];

      if (lastId === endId) {
        return currentPath
          .map((id) => this.knowledgeGraph.getNode(id))
          .filter((n): n is KnowledgeNode => n !== undefined);
      }

      const edges = this.knowledgeGraph.getOutgoingEdges(lastId);
      for (const edge of edges) {
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          queue.push([...currentPath, edge.targetId]);
        }
      }
    }

    return null;
  }
}
