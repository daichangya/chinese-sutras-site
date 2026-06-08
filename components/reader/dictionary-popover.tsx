/**
 * 阅读器内嵌字典 Popover
 * 选中文字后弹出快速释义（按来源分组）
 *
 * 注：当前未接入阅读器，辞典查词已统一在 ComprehensionPanel 中。
 * 保留供后续「双击快查」等轻量交互复用。
 * @author 代长亚
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getDictionarySourceLabel } from "@/lib/dictionaries/sources";
import type { DictGroup } from "@/components/dictionary/dictionary-result";

export type DictEntry = {
  id: string;
  source: string;
  headword: string;
  definition: string;
  reading: string | null;
  lang: string;
  definitionHtml?: string | null;
};

/** 快速释义弹窗 */
export function DictionaryPopover({
  position,
  onClose,
}: {
  position: { top: number; left: number } | null;
  onClose: () => void;
}) {
  const [groups, setGroups] = useState<DictGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const lookup = useCallback(async (text: string) => {
    setLoading(true);
    setQuery(text);
    setGroups([]);
    try {
      const res = await fetch(
        `/api/dictionary/lookup/grouped?q=${encodeURIComponent(text)}&size=2`,
      );
      const data = (await res.json()) as { groups?: DictGroup[] };
      setGroups(data.groups ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!query) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [query, onClose]);

  if (!position) return null;

  const reading =
    groups.flatMap((g) => g.entries).find((e) => e.reading)?.reading ?? null;

  return (
    <div
      ref={containerRef}
      className="fixed z-[100] w-80 rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] shadow-jx"
      style={{ top: position.top + 8, left: position.left }}
    >
      <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-[var(--jx-border)]">
        <span className="text-sm font-semibold text-[var(--foreground)]">
          {query}
          {reading && (
            <span className="ml-2 text-xs font-normal text-[var(--muted)]">{reading}</span>
          )}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors text-xs"
        >
          关闭
        </button>
      </div>

      <div className="max-h-64 overflow-y-auto px-4 py-3 text-sm">
        {loading ? (
          <p className="text-[var(--muted)] text-xs">查询辞典…</p>
        ) : groups.length === 0 ? (
          <p className="text-[var(--muted)] text-xs">未找到释义，试试其他字词</p>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.source}>
                <p className="text-xs font-medium text-[var(--jx-muted-label)] mb-1.5">
                  {group.sourceName}
                </p>
                <div className="space-y-2">
                  {group.entries.map((entry) => (
                    <div key={entry.id} className="pb-1 last:pb-0">
                      <span className="font-medium text-[var(--jx-ink)]">{entry.headword}</span>
                      <p className="text-sm leading-relaxed text-[var(--jx-ink)] mt-0.5 line-clamp-3">
                        {entry.definition}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-4 pb-3 pt-2 border-t border-[var(--jx-border)]">
        <Link
          href={`/dictionary?q=${encodeURIComponent(query)}`}
          className="flex items-center gap-1.5 text-xs text-[var(--jx-accent)] hover:text-[var(--jx-accent-soft)] transition-colors"
          onClick={onClose}
        >
          <ExternalLink className="size-3" aria-hidden="true" />
          查看完整解释
        </Link>
      </div>
    </div>
  );
}
