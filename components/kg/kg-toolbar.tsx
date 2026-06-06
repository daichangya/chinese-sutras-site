/**
 * 知识图谱顶部主搜索工具栏
 * @author jingxin
 */
"use client";

import { TYPE_LABELS } from "@/lib/kg/labels";
import { Input } from "@/components/ui/input";

const ENTITY_TYPES = [
  { value: "", label: "全部类型" },
  ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
];

export function KgToolbar({
  query,
  onQueryChange,
  entityType,
  onEntityTypeChange,
  depth,
  onDepthChange,
  onSearch,
  loading,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  entityType: string;
  onEntityTypeChange: (t: string) => void;
  depth: number;
  onDepthChange: (d: number) => void;
  onSearch: () => void;
  loading?: boolean;
}) {
  return (
    <form
      className="mb-3 flex flex-col gap-3 rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
      data-testid="kg-toolbar"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          data-testid="kg-main-search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="搜索实体（人物、典籍、宗派…）"
          aria-label="搜索知识图谱实体"
          className="min-w-0 flex-1 text-sm"
        />
        <select
          value={entityType}
          onChange={(e) => onEntityTypeChange(e.target.value)}
          className="jx-input shrink-0 text-sm sm:w-28"
          aria-label="实体类型筛选"
        >
          {ENTITY_TYPES.map((t) => (
            <option key={t.value || "all"} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-lg bg-[var(--jx-accent-cinnabar)] px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "搜索中…" : "搜索"}
        </button>
      </div>
      <label className="flex shrink-0 items-center gap-2 text-xs text-[var(--muted)]">
        展开深度
        <input
          type="range"
          min={1}
          max={4}
          value={depth}
          onChange={(e) => onDepthChange(parseInt(e.target.value, 10))}
          className="w-20"
          aria-label="图谱展开深度"
        />
        <span className="w-4 text-[var(--foreground)]">{depth}</span>
      </label>
    </form>
  );
}
