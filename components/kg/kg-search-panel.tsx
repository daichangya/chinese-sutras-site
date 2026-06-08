/**
 * 知识图谱搜索结果列表
 * @author 代长亚
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
  region_hint?: string | null;
};

export function KgSearchPanel({
  results,
  loading,
  query,
  relaxedType,
  selectedEntityId,
  onSelect,
}: {
  results: KgSearchResult[];
  loading: boolean;
  query: string;
  relaxedType?: boolean;
  selectedEntityId: string | null;
  onSelect: (r: KgSearchResult) => void;
}) {
  return (
    <div className="flex h-full flex-col" data-testid="kg-search-results">
      <p className="jx-section-label border-b border-[var(--jx-border)]/40 px-3 py-2">搜索结果</p>
      <div className="flex-1 overflow-y-auto p-2">
        {relaxedType && !loading && results.length > 0 && (
          <p
            className="mb-2 rounded-md bg-amber-50 px-2 py-1.5 text-[10px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
            data-testid="kg-search-relaxed-type"
          >
            当前类型无匹配，已显示全部类型的相关结果
          </p>
        )}
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
                {r.region_hint && <span>{r.region_hint}</span>}
                {r.dynasty && <span>{r.dynasty}</span>}
                {r.relation_count > 0 && <span>{r.relation_count} 关系</span>}
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
