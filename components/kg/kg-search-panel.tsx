/**
 * 知识图谱搜索结果列表
 * @author jingxin
 */
"use client";

import { labelType } from "@/lib/kg/labels";

export type KgSearchResult = {
  id: string;
  slug: string;
  name_zh: string;
  name_en: string | null;
  entity_type: string;
  relation_count: number;
  description: string | null;
  dynasty: string | null;
};

export function KgSearchPanel({
  results,
  loading,
  query,
  selectedEntityId,
  onSelect,
}: {
  results: KgSearchResult[];
  loading: boolean;
  query: string;
  selectedEntityId: string | null;
  onSelect: (r: KgSearchResult) => void;
}) {
  return (
    <div className="flex h-full flex-col" data-testid="kg-search-results">
      <p className="jx-section-label border-b border-[var(--jx-border)] px-3 py-2">搜索结果</p>
      <div className="flex-1 overflow-y-auto p-2">
        {loading && <p className="p-4 text-center text-xs text-[var(--muted)]">搜索中…</p>}
        {!loading && results.length === 0 && query && (
          <p className="p-4 text-center text-xs text-[var(--muted)]">未找到相关实体</p>
        )}
        {!loading && results.length === 0 && !query && (
          <p className="p-4 text-center text-xs text-[var(--muted)]">输入关键词并搜索</p>
        )}
        {!loading &&
          results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onSelect(r)}
              className={`mb-1 w-full rounded-lg px-3 py-2.5 text-left transition-colors ${
                selectedEntityId === r.id
                  ? "bg-[var(--jx-accent-cinnabar)]/10 ring-1 ring-[var(--jx-accent-cinnabar)]/30"
                  : "hover:bg-[var(--jx-paper)]"
              }`}
            >
              <div className="text-sm font-medium text-[var(--jx-ink-classical)]">{r.name_zh}</div>
              {r.description && (
                <div className="mt-0.5 line-clamp-2 text-xs text-[var(--muted)]">{r.description}</div>
              )}
              <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-[var(--jx-muted-label)]">
                <span>{labelType(r.entity_type)}</span>
                {r.dynasty && <span>{r.dynasty}</span>}
                {r.relation_count > 0 && <span>{r.relation_count} 关系</span>}
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
