/**
 * 字典查询页面客户端组件（带 Error Boundary 包裹）
 * @author 代长亚
 */
"use client";

import { useEffect, useState } from "react";
import { DictionarySearch } from "./dictionary-search";
import { DictionaryGroupedResults, getSourceLabel, type DictGroup } from "./dictionary-result";
import { ErrorBoundary } from "@/components/error/error-boundary";
import { DiscoveryLayout } from "@/components/layout/discovery-layout";
import { Chip } from "@/components/ui/chip";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { SectionHeader } from "@/components/ui/section-header";
import { AlertCircle } from "lucide-react";

export function DictionaryPageClient({ q, source }: { q: string; source: string }) {
  return (
    <ErrorBoundary
      fallback={({ error, onReset }) => (
        <PageShell variant="fade">
          <PageHeader label="辞典" title="佛学辞典" accent />
          <div
            role="alert"
            className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-[var(--jx-error-border)] bg-[var(--jx-error-bg)] p-10 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--jx-error-bg)]">
              <AlertCircle className="h-7 w-7 text-[var(--jx-error)]" aria-hidden="true" />
            </div>
            <h2 className="mb-2 text-xl font-semibold text-[var(--foreground)]">辞典查询出错</h2>
            <p className="mb-4 max-w-md text-sm text-[var(--muted)]">查询功能暂时不可用，请重试。</p>
            {error && (
              <p className="mb-4 max-w-sm rounded-lg bg-[var(--jx-paper)] px-3 py-2 font-mono text-xs text-[var(--jx-error)]">
                {error.message}
              </p>
            )}
            <button
              type="button"
              onClick={onReset}
              className="cursor-pointer rounded-full bg-[var(--jx-accent-cinnabar)] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--jx-accent-cinnabar-hover)]"
            >
              重试
            </button>
          </div>
        </PageShell>
      )}
    >
      <DictionaryPageInner q={q} source={source} />
    </ErrorBoundary>
  );
}

function DictionaryPageInner({ q, source }: { q: string; source: string }) {
  const [groups, setGroups] = useState<DictGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);
  const [sources, setSources] = useState<Array<{ code: string; nameZh: string; entryCount: number }>>([]);
  const [activeSource, setActiveSource] = useState(source);

  useEffect(() => {
    fetch("/api/dictionary/sources")
      .then((r) => r.json())
      .then((data: { sources?: typeof sources }) => setSources(data.sources ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setActiveSource(source);
  }, [source]);

  useEffect(() => {
    if (!q.trim()) {
      setHasQueried(false);
      setGroups([]);
      setTotal(0);
      return;
    }
    const controller = new AbortController();
    const lookup = async () => {
      setLoading(true);
      setHasQueried(true);
      try {
        const params = new URLSearchParams({ q: q.trim(), size: "10" });
        if (activeSource) params.set("source", activeSource);
        const res = await fetch(`/api/dictionary/lookup/grouped?${params.toString()}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { groups?: DictGroup[]; total?: number };
        setGroups(data.groups ?? []);
        setTotal(data.total ?? 0);
      } catch {
        if (!controller.signal.aborted) {
          setGroups([]);
          setTotal(0);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    lookup();
    return () => controller.abort();
  }, [q, activeSource]);

  const sourceFilter =
    sources.length > 0 ? (
      <FilterBar>
        <Chip size="sm" variant="filter" active={!activeSource} onClick={() => setActiveSource("")}>
          全部来源
        </Chip>
        {sources.map((s) => (
          <Chip
            key={s.code}
            size="sm"
            variant="filter"
            active={activeSource === s.code}
            onClick={() => setActiveSource(s.code)}
          >
            {getSourceLabel(s.code)}
            <span className="ml-1 opacity-70">({s.entryCount})</span>
          </Chip>
        ))}
      </FilterBar>
    ) : null;

  return (
    <DiscoveryLayout
      label="辞典"
      title="佛学辞典"
      accent
      headerExtra={
        <>
          <div className="mb-6 md:mb-8">
            <DictionarySearch />
          </div>
          {sourceFilter}
        </>
      }
    >
      {loading && (
        <div className="flex items-center gap-3 text-sm text-[var(--jx-muted-label)]">
          <span className="inline-block size-4 animate-spin rounded-full border-2 border-[var(--jx-muted-label)] border-t-transparent" />
          查询辞典中…
        </div>
      )}

      {!loading && hasQueried && (
        <DictionaryGroupedResults groups={groups} query={q} total={total} />
      )}

      {!loading && !hasQueried && (
        <div className="mt-2">
          <SectionHeader label="快速开始" />
          <div className="rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] p-6">
            <p className="text-sm leading-relaxed text-[var(--foreground)]">
              输入佛学词汇即可查询释义，支持：
            </p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--jx-muted-label)]">
              <li>· 丁福保佛学大辞典、南山律学辞典、NTI 汉英佛学辞典</li>
              <li>· 按辞典分组展示，精确词条优先</li>
              <li>· 自动匹配繁简字体</li>
            </ul>
            <FilterBar className="mb-0 mt-4">
              {["菩提", "般若", "涅槃", "因果", "禅定"].map((term) => (
                <a
                  key={term}
                  href={`/dictionary?q=${encodeURIComponent(term)}`}
                  className="jx-chip px-2.5 py-0.5 text-xs"
                >
                  {term}
                </a>
              ))}
            </FilterBar>
          </div>
        </div>
      )}
    </DiscoveryLayout>
  );
}
