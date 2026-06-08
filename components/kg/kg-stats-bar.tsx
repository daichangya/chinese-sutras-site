/**
 * 知识图谱统计面板（可折叠）
 * @author 代长亚
 */
"use client";

import { useState } from "react";
import { labelType, PREDICATE_COLORS, PREDICATE_LABELS, TYPE_COLORS } from "@/lib/kg/labels";

export type KgStats = {
  entityCounts: Record<string, number>;
  relationCount: number;
  relationCounts: Record<string, number>;
  totalEntities: number;
};

export function KgStatsBar({ stats }: { stats: KgStats | null }) {
  const [expanded, setExpanded] = useState(false);

  if (!stats) return null;

  const summary =
    stats.totalEntities === 0
      ? "暂无图谱数据"
      : `共 ${stats.totalEntities.toLocaleString()} 实体 · ${stats.relationCount.toLocaleString()} 关系`;

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-2 text-left text-xs text-[var(--jx-muted-label)] hover:text-[var(--foreground)]"
        data-testid="kg-stats-toggle"
      >
        <span>{expanded ? "▼" : "▶"}</span>
        <span data-testid="kg-stats-summary">{summary}</span>
      </button>
      {expanded && stats.totalEntities > 0 && (
        <div
          className="mt-2 flex flex-wrap gap-6 rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] px-4 py-3"
          data-testid="kg-stats-panel"
        >
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-[var(--jx-muted-label)]">实体</span>
            {Object.entries(stats.entityCounts).map(([type, count]) => (
              <span key={type} className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: TYPE_COLORS[type] ?? "#888" }}
                />
                {labelType(type)}
                <span className="font-medium text-[var(--foreground)]">{count.toLocaleString()}</span>
              </span>
            ))}
          </div>
          {Object.keys(stats.relationCounts).length > 0 && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium text-[var(--jx-muted-label)]">关系</span>
              {Object.entries(stats.relationCounts).map(([pred, count]) => (
                <span key={pred} className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                  <span
                    className="inline-block h-0.5 w-3 rounded"
                    style={{ background: PREDICATE_COLORS[pred] ?? "#bbb5a6" }}
                  />
                  {PREDICATE_LABELS[pred] ?? pred}
                  <span className="font-medium text-[var(--foreground)]">{count.toLocaleString()}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
