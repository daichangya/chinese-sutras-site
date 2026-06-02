/**
 * 搜索页 — 统一视觉，结果卡片化
 * @author jingxin
 */
import Link from "next/link";
import { SearchForm } from "@/components/home/search-form";
import { listPopularSutras, searchParagraphs } from "@/lib/search/fts";
import { getSqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  getSqlite();
  const { q = "" } = await searchParams;
  const results = q.trim() ? searchParagraphs(q) : [];
  const popular = listPopularSutras(8);

  return (
    <div className="jx-page animate-jx-fade">
      <header className="mb-8">
        <p className="jx-section-label">检索</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">搜索经文</h1>
      </header>

      <div className="mb-8 max-w-xl">
        <SearchForm defaultQuery={q} />
      </div>

      {q.trim() && (
        <section className="mt-8">
          {results.length === 0 ? (
            <div data-testid="search-empty">
              <p className="text-[var(--muted)] mb-8">未找到与「<span className="font-medium text-[var(--foreground)]">{q}</span>」相关的结果。</p>
              <div className="flex items-center gap-3 mb-6">
                <p className="jx-section-label">试试这些热门经典</p>
                <div className="h-px flex-1 bg-gradient-to-r from-[var(--jx-border)] to-transparent" />
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
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <p className="jx-section-label">
                  {results.length} 条结果
                </p>
                <div className="h-px flex-1 bg-gradient-to-r from-[var(--jx-border)] to-transparent" />
              </div>
              <ul data-testid="search-results" className="space-y-3">
                {results.map((hit) => (
                  <li key={hit.paragraphId} className="animate-jx-fade">
                    <Link
                      href={`/sutra/${hit.sutraSlug}#p-${hit.seq}`}
                      className="jx-sutra-card block px-5 py-5"
                    >
                      <span className="font-medium text-amber-900 dark:text-amber-400">{hit.sutraTitle}</span>
                      <p
                        className="mt-2 text-sm leading-relaxed text-[var(--muted)]"
                        dangerouslySetInnerHTML={{ __html: hit.snippet }}
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
