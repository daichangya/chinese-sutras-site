/**
 * 搜索页 — 统一检索（经目 / 段落 / 辞典 / 人物）
 * @author 代长亚
 */
import { SearchPageClient } from "@/components/home/search-page-client";
import { listColloquialSutraIds } from "@/lib/db/perf-cache";
import { listPopularSutras } from "@/lib/search/fts";
import { unifiedSearch } from "@/lib/search/unified";
import { getSqlite } from "@/lib/db";

export const revalidate = 300;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  getSqlite();
  const { q = "" } = await searchParams;
  const results = q.trim() ? unifiedSearch(q.trim()) : null;
  const popular = listPopularSutras(8);
  const colloquialSutraIds = listColloquialSutraIds();

  return (
    <SearchPageClient
      q={q}
      results={results}
      popular={popular}
      colloquialSutraIds={colloquialSutraIds}
    />
  );
}
