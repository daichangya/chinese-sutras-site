/**
 * 字典结果列表（按来源分组）
 * @author 代长亚
 */
"use client";

import { useState } from "react";
import type { DictEntry } from "@/components/reader/dictionary-popover";
import { getDictionarySourceLabel } from "@/lib/dictionaries/sources";
import { DictionaryDefinitionBody } from "@/components/dictionary/dictionary-definition-body";

export type DictGroup = {
  source: string;
  sourceName: string;
  total: number;
  entries: DictEntry[];
};

const COLLAPSE_THRESHOLD = 3;

export function getSourceLabel(code: string): string {
  return getDictionarySourceLabel(code);
}

function getReadingLabel(entry: DictEntry): string | null {
  if (!entry.reading) return null;
  const lang = entry.lang?.toLowerCase();
  if (lang === "zh" || lang === "zh-hans" || lang === "zh-hant") {
    return `读音：${entry.reading}`;
  }
  return entry.reading;
}

function DictEntryCard({ entry }: { entry: DictEntry }) {
  return (
    <li className="animate-jx-fade rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] p-5 transition-colors hover:border-[var(--jx-border-strong)]">
      <div className="flex items-baseline gap-3 flex-wrap">
        <h3 className="text-xl font-semibold text-[var(--jx-ink)]">{entry.headword}</h3>
        {entry.reading && (
          <span className="text-sm text-[var(--jx-muted-label)]">{getReadingLabel(entry)}</span>
        )}
      </div>
      <DictionaryDefinitionBody entry={entry} />
    </li>
  );
}

function DictGroupSection({
  group,
  defaultExpanded = false,
}: {
  group: DictGroup;
  defaultExpanded?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const hasMore = group.entries.length > COLLAPSE_THRESHOLD;
  const visible = expanded ? group.entries : group.entries.slice(0, COLLAPSE_THRESHOLD);

  return (
    <section className="mb-8" data-testid={`dict-group-${group.source}`}>
      <div className="mb-4 flex items-center gap-3">
        <h2 className="text-base font-semibold text-[var(--jx-ink)]">{group.sourceName}</h2>
        <span className="rounded-full bg-[var(--jx-paper-deep)] px-2 py-0.5 text-xs text-[var(--jx-muted-label)]">
          {group.total} 条
        </span>
        <div className="h-px flex-1 bg-gradient-to-r from-[var(--jx-border)]/40 to-transparent" />
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        {visible.map((entry) => (
          <DictEntryCard key={entry.id} entry={entry} />
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-xs text-[var(--jx-accent)] hover:underline"
        >
          {expanded ? "收起" : `展开全部 ${group.entries.length} 条`}
        </button>
      )}
    </section>
  );
}

export function DictionaryGroupedResults({
  groups,
  query,
  total,
}: {
  groups: DictGroup[];
  query: string;
  total: number;
}) {
  if (groups.length === 0) {
    return (
      <div data-testid="dict-empty">
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-deep)] p-10 text-center min-h-[200px]">
          <div className="mb-3 text-3xl opacity-40">◎</div>
          <p className="text-[var(--muted)] text-sm">
            未找到「<span className="font-medium text-[var(--foreground)]">{query}</span>」的释义
          </p>
          <p className="text-xs text-[var(--jx-muted-label)] mt-1">试试其他字词，或切换繁简体再查</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="dict-results">
      <div className="flex items-center gap-3 mb-6">
        <p className="jx-section-label">
          {total} 条释义 · {groups.length} 部辞典
        </p>
        <div className="h-px flex-1 bg-gradient-to-r from-[var(--jx-border)]/40 to-transparent" />
      </div>
      {groups.map((group, i) => (
        <DictGroupSection key={group.source} group={group} defaultExpanded={i === 0} />
      ))}
    </div>
  );
}

/** 扁平列表（兼容旧用法） */
export function DictionaryResults({ entries, query }: { entries: DictEntry[]; query: string }) {
  if (entries.length === 0) {
    return <DictionaryGroupedResults groups={[]} query={query} total={0} />;
  }
  const bySource = new Map<string, DictEntry[]>();
  for (const e of entries) {
    const list = bySource.get(e.source) ?? [];
    list.push(e);
    bySource.set(e.source, list);
  }
  const groups: DictGroup[] = [...bySource.entries()].map(([source, ents]) => ({
    source,
    sourceName: getSourceLabel(source),
    total: ents.length,
    entries: ents,
  }));
  return <DictionaryGroupedResults groups={groups} query={query} total={entries.length} />;
}
