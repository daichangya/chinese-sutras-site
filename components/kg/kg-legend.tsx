/**
 * 知识图谱动态图例
 * @author 代长亚
 */
"use client";

import { PREDICATE_COLORS, PREDICATE_LABELS, TYPE_COLORS, TYPE_LABELS } from "@/lib/kg/labels";
import type { KgGraphEdge, KgGraphNode } from "@/lib/kg/types";

export function KgLegend({
  nodes,
  edges,
}: {
  nodes: KgGraphNode[];
  edges: KgGraphEdge[];
}) {
  const usedNodeTypes = [...new Set(nodes.map((n) => n.entityType))].sort();
  const usedPredicates = [...new Set(edges.map((e) => e.predicate))].sort();

  if (usedNodeTypes.length === 0 && usedPredicates.length === 0) return null;

  return (
    <div
      className="pointer-events-none absolute bottom-3 right-3 flex max-w-[min(100%,420px)] flex-wrap items-center gap-3 rounded-lg border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)]/95 px-3 py-2 text-[10px] shadow-sm backdrop-blur-sm"
      data-testid="kg-legend"
    >
      {usedNodeTypes.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-[var(--jx-muted-label)]">节点</span>
          {usedNodeTypes.map((type) => (
            <span key={type} className="inline-flex items-center gap-1 text-[var(--muted)]">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ background: TYPE_COLORS[type] ?? "#888" }}
              />
              {TYPE_LABELS[type] ?? type}
            </span>
          ))}
        </div>
      )}
      {usedNodeTypes.length > 0 && usedPredicates.length > 0 && (
        <span className="hidden h-3 w-px bg-[var(--jx-border)] sm:inline-block" />
      )}
      {usedPredicates.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-[var(--jx-muted-label)]">关系</span>
          {usedPredicates.map((pred) => (
            <span key={pred} className="inline-flex items-center gap-1 text-[var(--muted)]">
              <span
                className="inline-block h-0.5 w-3 rounded"
                style={{ background: PREDICATE_COLORS[pred] ?? "#bbb5a6" }}
              />
              {PREDICATE_LABELS[pred] ?? pred}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
