"use client";

/**
 * 搜索页客户端壳层（统一检索 + 分组结果）
 * @author 代长亚
 */
import { ErrorBoundary } from "@/components/error/error-boundary";
import { DiscoveryLayout } from "@/components/layout/discovery-layout";
import Link from "next/link";
import { useMemo, useState } from "react";
import { SearchForm } from "@/components/home/search-form";
import type { PopularSutra } from "@/lib/canon/popular";
import { groupHitsBySutra } from "@/lib/search/group-hits";
import type { UnifiedSearchResult } from "@/lib/search/types";
import {
  applySearchFilters,
  extractSearchCategories,
  type SearchFilters,
} from "@/lib/search/filter-results";
import { SearchFacetSidebar } from "@/components/search/search-facet-sidebar";
import { personPath } from "@/lib/kg/slug";
import { getSourceLabel } from "@/components/dictionary/dictionary-result";
import { Chip } from "@/components/ui/chip";
import { FilterBar } from "@/components/ui/filter-bar";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";

type TabKey = "all" | "sutras" | "paragraphs" | "dictionary" | "persons";

export function SearchPageClient({
  q,
  results,
  popular,
  colloquialSutraIds = [],
}: {
  q: string;
  results: UnifiedSearchResult | null;
  popular: PopularSutra[];
  colloquialSutraIds?: string[];
}) {
  return (
    <ErrorBoundary
      fallback={({ error, onReset }) => (
        <PageShell variant="fade">
          <PageHeader label="检索" title="搜索" accent />
          <div
            role="alert"
            className="rounded-xl border border-[var(--jx-border)] p-10 text-center"
          >
            <p className="text-[var(--muted)]">搜索功能暂时不可用</p>
            {error && (
              <p className="mt-2 text-xs text-[var(--jx-error)]">{error.message}</p>
            )}
            <button
              type="button"
              onClick={onReset}
              className="mt-4 cursor-pointer rounded-full bg-[var(--jx-accent-cinnabar)] px-5 py-2 text-sm text-white"
            >
              重试
            </button>
          </div>
        </PageShell>
      )}
    >
      <SearchPageInner
        q={q}
        results={results}
        popular={popular}
        colloquialSutraIds={colloquialSutraIds}
      />
    </ErrorBoundary>
  );
}

function SearchPageInner({
  q,
  results,
  popular,
  colloquialSutraIds,
}: {
  q: string;
  results: UnifiedSearchResult | null;
  popular: PopularSutra[];
  colloquialSutraIds: string[];
}) {
  const [tab, setTab] = useState<TabKey>("all");
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    colloquialOnly: false,
  });
  const trimmed = q.trim();
  const colloquialSet = useMemo(
    () => new Set(colloquialSutraIds),
    [colloquialSutraIds],
  );
  const filteredResults = useMemo(
    () => (results ? applySearchFilters(results, filters, colloquialSet) : null),
    [results, filters, colloquialSet],
  );
  const facetCategories = useMemo(
    () => (results ? extractSearchCategories(results) : []),
    [results],
  );
  const grouped = filteredResults ? groupHitsBySutra(filteredResults.paragraphs) : [];
  const totalCount = filteredResults
    ? filteredResults.sutras.length +
      filteredResults.paragraphs.length +
      filteredResults.dictionary.length +
      filteredResults.persons.length
    : 0;

  const tabs: Array<{ key: TabKey; label: string; count: number }> = filteredResults
    ? [
        { key: "all", label: "全部", count: totalCount },
        { key: "sutras", label: "经目", count: filteredResults.sutras.length },
        { key: "paragraphs", label: "段落", count: filteredResults.paragraphs.length },
        { key: "dictionary", label: "辞典", count: filteredResults.dictionary.length },
        { key: "persons", label: "人物", count: filteredResults.persons.length },
      ]
    : [];

  function toggleCategory(category: string) {
    setFilters((prev) => {
      const exists = prev.categories.includes(category);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== category)
          : [...prev.categories, category],
      };
    });
  }

  const searchForm = (
    <div className="mb-6 md:mb-8 max-w-2xl">
      <SearchForm key={q} defaultQuery={q} />
    </div>
  );

  const resultsContent =
    trimmed && filteredResults ? (
      <>
        <FilterBar>
          {tabs.map((t) => (
            <Chip
              key={t.key}
              size="sm"
              variant="filter"
              active={tab === t.key}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.count > 0 && <span className="ml-1 opacity-70">({t.count})</span>}
            </Chip>
          ))}
        </FilterBar>

        {totalCount === 0 ? (
          <EmptySearch q={trimmed} popular={popular} />
        ) : (
          <div data-testid="search-results" className="space-y-10">
            {(tab === "all" || tab === "sutras") && filteredResults.sutras.length > 0 && (
              <ResultSection title="经目" count={filteredResults.sutras.length}>
                <ul className="space-y-2">
                  {filteredResults.sutras.map((s) => (
                    <li key={s.sutraId}>
                      <Link href={`/sutra/${s.sutraSlug}`} className="jx-sutra-card block px-4 py-3">
                        <span className="font-medium text-[var(--jx-ink-classical)]">{s.title}</span>
                        <p className="mt-1 text-xs text-[var(--muted)]">
                          {[s.translator, s.category, s.cbetaId].filter(Boolean).join(" · ")}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </ResultSection>
            )}

            {(tab === "all" || tab === "paragraphs") && grouped.length > 0 && (
              <ResultSection title="段落" count={filteredResults.paragraphs.length}>
                <ul className="space-y-4">
                  {grouped.map((group) => (
                    <li key={group.sutraId} className="overflow-hidden rounded-xl border border-[var(--jx-border)]">
                      <div className="bg-[var(--jx-paper-deep)] px-5 py-3 text-sm font-medium">
                        <Link href={`/sutra/${group.sutraSlug}`} className="text-[var(--jx-accent-cinnabar)]">
                          {group.sutraTitle}
                        </Link>
                        <span className="ml-2 text-xs text-[var(--jx-muted-label)]">
                          {group.hits.length} 处匹配
                        </span>
                      </div>
                      <ul className="divide-y divide-[var(--jx-border)]">
                        {group.hits.slice(0, tab === "paragraphs" ? 8 : 3).map((hit) => (
                          <li key={hit.paragraphId}>
                            <Link
                              href={`/sutra/${hit.sutraSlug}#p-${hit.seq}`}
                              className="jx-search-mark block px-4 py-3 text-sm leading-relaxed text-[var(--muted)] hover:bg-[var(--jx-paper-deep)]"
                              dangerouslySetInnerHTML={{ __html: hit.snippet }}
                            />
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </ResultSection>
            )}

            {(tab === "all" || tab === "dictionary") && filteredResults.dictionary.length > 0 && (
              <ResultSection title="辞典" count={filteredResults.dictionary.length}>
                <ul className="space-y-2">
                  {filteredResults.dictionary.map((e) => (
                    <li key={e.id}>
                      <Link
                        href={`/dictionary?q=${encodeURIComponent(e.headword)}`}
                        className="jx-sutra-card block px-5 py-4"
                      >
                        <span className="font-medium">{e.headword}</span>
                        <span className="ml-2 text-xs text-[var(--jx-muted-label)]">
                          {getSourceLabel(e.source)}
                        </span>
                        <p className="mt-2 line-clamp-2 text-sm text-[var(--muted)]">{e.definition}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </ResultSection>
            )}

            {(tab === "all" || tab === "persons") && filteredResults.persons.length > 0 && (
              <ResultSection title="人物" count={filteredResults.persons.length}>
                <ul className="space-y-2">
                  {filteredResults.persons.map((p) => (
                    <li key={p.id}>
                      <Link href={personPath(p.slug)} className="jx-sutra-card block px-5 py-4">
                        <span className="font-medium">{p.nameZh}</span>
                        {p.dynasty && (
                          <span className="ml-2 text-xs text-[var(--muted)]">{p.dynasty}</span>
                        )}
                        {p.relationCount > 0 && (
                          <span className="ml-2 text-xs text-[var(--jx-muted-label)]">
                            {p.relationCount} 关系
                          </span>
                        )}
                        {p.nameEn && (
                          <span className="ml-2 text-xs text-[var(--muted)]">{p.nameEn}</span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </ResultSection>
            )}
          </div>
        )}
      </>
    ) : null;

  return (
    <DiscoveryLayout
      label="检索"
      title="统一搜索"
      description="经目、全文段落、辞典与人物一次检索"
      accent
      headerExtra={searchForm}
      sidebar={
        trimmed && filteredResults ? (
          <SearchFacetSidebar
            categories={facetCategories}
            selectedCategories={filters.categories}
            colloquialOnly={filters.colloquialOnly}
            showColloquialFilter={colloquialSet.size > 0}
            onToggleCategory={toggleCategory}
            onColloquialOnlyChange={(value) =>
              setFilters((prev) => ({ ...prev, colloquialOnly: value }))
            }
            onClear={() => setFilters({ categories: [], colloquialOnly: false })}
          />
        ) : undefined
      }
    >
      {resultsContent}
    </DiscoveryLayout>
  );
}

function ResultSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="jx-section-block">
        <p className="jx-section-block__title">
          {title} · {count}
        </p>
        <div className="jx-section-block__line" />
      </div>
      {children}
    </section>
  );
}

function EmptySearch({ q, popular }: { q: string; popular: PopularSutra[] }) {
  return (
    <div data-testid="search-empty">
      <p className="mb-8 text-[var(--muted)]">
        未找到与「<span className="font-medium text-[var(--foreground)]">{q}</span>」相关的结果。
      </p>
      <div className="mb-6 flex items-center gap-3">
        <p className="jx-section-label">试试这些热门经典</p>
        <div className="h-px flex-1 bg-gradient-to-r from-[var(--jx-border)]/40 to-transparent" />
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {popular.map((s) => (
          <li key={s.id}>
            <Link href={`/sutra/${s.slug}`} className="jx-sutra-card block px-4 py-4 text-sm font-medium">
              {s.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
