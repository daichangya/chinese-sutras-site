/**
 * 图谱节点/边合并（无 d3 依赖，供客户端懒加载力导向图时使用）
 * @author 代长亚
 */
import type { KgGraphEdge, KgGraphNode } from "@/lib/kg/types";

export function mergeGraphData(
  base: { nodes: KgGraphNode[]; edges: KgGraphEdge[] },
  incoming: { nodes: KgGraphNode[]; edges: KgGraphEdge[] },
): { nodes: KgGraphNode[]; edges: KgGraphEdge[] } {
  const nodeMap = new Map(base.nodes.map((n) => [n.id, n]));
  for (const n of incoming.nodes) {
    if (!nodeMap.has(n.id)) nodeMap.set(n.id, n);
  }
  const edgeKeys = new Set(base.edges.map((e) => `${e.source}|${e.predicate}|${e.target}`));
  const edges = [...base.edges];
  for (const e of incoming.edges) {
    const k = `${e.source}|${e.predicate}|${e.target}`;
    if (!edgeKeys.has(k)) {
      edgeKeys.add(k);
      edges.push(e);
    }
  }
  return { nodes: [...nodeMap.values()], edges };
}
