/**
 * 无结构化关系时的描述提及面板
 * @author 代长亚
 */
"use client";

import { useEffect, useState } from "react";
import { labelType } from "@/lib/kg/labels";
import { TYPE_COLORS } from "@/lib/kg/labels";

export type KgMentionHit = {
  id: string;
  slug: string;
  name_zh: string;
  entity_type: string;
};

export function KgMentionsPanel({
  entitySlug,
  entityName,
  onEntityClick,
}: {
  entitySlug: string;
  entityName: string;
  onEntityClick: (slug: string, id: string) => void;
}) {
  const [mentions, setMentions] = useState<KgMentionHit[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMentions(null);
    void fetch(`/api/kg/mentions?slug=${encodeURIComponent(entitySlug)}`)
      .then((r) => r.json())
      .then((data: { mentions?: KgMentionHit[] }) => {
        if (cancelled) return;
        setMentions(data.mentions ?? []);
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setError(e.message ?? "加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [entitySlug]);

  if (loading) {
    return (
      <div className="flex h-[480px] items-center justify-center text-sm text-[var(--muted)]" data-testid="kg-mentions-loading">
        扫描描述中的关联实体…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[480px] items-center justify-center text-sm text-[var(--muted)]">
        提及加载失败：{error}
      </div>
    );
  }

  if (!mentions || mentions.length === 0) {
    return (
      <div
        className="flex h-[480px] flex-col items-center justify-center gap-2 px-6 text-center text-sm text-[var(--muted)]"
        data-testid="kg-mentions-empty"
      >
        <p>「{entityName}」暂无结构化关系</p>
        <p className="text-xs">描述中也没有可关联的已知实体</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[480px] flex-col p-4" data-testid="kg-mentions-panel">
      <div className="mb-3">
        <p className="text-sm font-medium text-[var(--jx-ink-classical)]">描述中提及的实体</p>
        <p className="text-xs text-[var(--jx-muted-label)]">
          推断关联（非结构化）— 共 {mentions.length} 条
        </p>
      </div>
      <ul className="flex-1 space-y-2 overflow-y-auto">
        {mentions.map((m) => (
          <li key={m.id}>
            <button
              type="button"
              onClick={() => onEntityClick(m.slug, m.id)}
              className="flex w-full items-center gap-2 rounded-lg border border-[var(--jx-border)] px-3 py-2 text-left text-sm hover:border-[var(--jx-accent-cinnabar)]/40 hover:bg-[var(--jx-paper)]"
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: TYPE_COLORS[m.entity_type] ?? "#888" }}
              />
              <span className="font-medium text-[var(--jx-ink-classical)]">{m.name_zh}</span>
              <span className="ml-auto text-[10px] text-[var(--jx-muted-label)]">
                {labelType(m.entity_type)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
