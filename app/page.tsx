import { SearchForm } from "@/components/home/search-form";
import { DailyVerseCard } from "@/components/home/daily-verse-card";
import { PopularSutraGrid } from "@/components/home/popular-sutra-grid";
import { TopicTeasers } from "@/components/home/topic-teasers";
import { listPopularSutras } from "@/lib/search/fts";
import { getDailyVerse, getParagraphById } from "@/lib/sutra/queries";
import { getSqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomePage() {
  getSqlite();
  const popular = listPopularSutras(12);
  const daily = getDailyVerse(todayKey());
  let verseText = daily?.customText ?? "凡所有相，皆是虚妄。";
  let verseSource = "";

  if (daily?.paragraphId) {
    const p = getParagraphById(daily.paragraphId);
    if (p) {
      verseText = p.text.slice(0, 80);
      const s = popular.find((x) => x.id === p.sutraId);
      verseSource = s?.title ?? "";
    }
  }

  return (
    <div className="animate-jx-fade">
      {/* Hero 区 — 无尽藏式沉浸首屏 */}
      <section className="relative overflow-hidden border-b border-[var(--jx-border)] bg-gradient-to-b from-[var(--jx-paper-deep)] to-[var(--background)]">
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-20 md:pb-20 md:pt-28">
          {/* 品牌标识（Medium 式极简 + 无尽藏式纸色） */}
          <p className="jx-section-label text-center text-amber-800/70 dark:text-amber-400/70">
            jingxin · 静心
          </p>
          <h1 className="mt-4 text-center text-5xl font-normal tracking-tight text-[var(--foreground)] md:text-6xl">
            让佛经更容易读懂
          </h1>
          <p className="mx-auto mt-5 max-w-md text-center text-[var(--muted)] leading-relaxed">
            现代化佛经阅读与理解平台，从原文、白话到 AI 辅助理解
          </p>

          {/* 搜索框 — 首屏居中（无尽藏式核心入口） */}
          <div className="mt-12 flex justify-center">
            <div className="w-full max-w-lg">
              <SearchForm />
            </div>
          </div>
        </div>

        {/* 装饰底纹 */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b45309' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </section>

      {/* 今日经句 — 无尽藏式大卡片 */}
      <section className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        <DailyVerseCard
          verseText={verseText}
          verseSource={verseSource}
          aiSummary={daily?.aiSummary}
        />
      </section>

      <hr className="jx-divider mx-auto max-w-4xl" />

      {/* 热门经典 — 无尽藏式卡片网格 */}
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <p className="jx-section-label">热门经典</p>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--jx-border)] to-transparent" />
        </div>
        {popular.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-4 opacity-30">📖</p>
            <p className="text-[var(--muted)] text-lg mb-2">暂无经文数据</p>
            <p className="text-sm text-[var(--jx-muted-label)]">
              导入 CBETA 经文后，此处将展示热门经典。
            </p>
          </div>
        ) : (
          <PopularSutraGrid sutras={popular} />
        )}
      </section>

      <hr className="jx-divider mx-auto max-w-4xl" />

      {/* 专题阅读 — 大藏经AI式专题入口 */}
      <section className="mx-auto max-w-4xl px-4 pb-16">
        <div className="flex items-center gap-3 mb-8">
          <p className="jx-section-label">专题阅读</p>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--jx-border)] to-transparent" />
        </div>
        <TopicTeasers />
      </section>
    </div>
  );
}
