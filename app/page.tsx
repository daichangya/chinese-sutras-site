import { SearchForm } from "@/components/home/search-form";
import { DailyVerseCard } from "@/components/home/daily-verse-card";
import { PopularSutraGrid } from "@/components/home/popular-sutra-grid";
import { TopicTeasers } from "@/components/home/topic-teasers";
import { HomeFeatureCards } from "@/components/home/home-feature-cards";
import { HomePopularChips } from "@/components/home/home-popular-chips";
import { HomeStatsBar } from "@/components/home/home-stats-bar";
import { SectionHeader } from "@/components/ui/section-header";
import { listPopularSutras } from "@/lib/search/fts";
import { getDailyVerse, getParagraphById } from "@/lib/sutra/queries";
import { getSqlite } from "@/lib/db";
import { getCorpusStats } from "@/lib/stats/corpus-stats";
import { brandHeroLabel } from "@/lib/brand";

export const revalidate = 3600;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export default function HomePage() {
  getSqlite();
  const stats = getCorpusStats();
  const popular = listPopularSutras(12);
  const daily = getDailyVerse(todayKey());
  let verseText = daily?.customText ?? "凡所有相，皆是虚妄。";
  let verseSource = "";

  if (daily?.snippetText) {
    verseText = daily.snippetText;
    verseSource = daily.sourceTitle ?? "";
  } else if (daily?.paragraphId) {
    const p = getParagraphById(daily.paragraphId);
    if (p) {
      verseText = p.text.slice(0, 80);
      const s = popular.find((x) => x.id === p.sutraId);
      verseSource = s?.title ?? "";
    }
  }

  return (
    <div className="animate-jx-fade">
      {/* Hero — FoJin 式单屏门户 */}
      <section
        className="jx-portal-hero jx-full relative flex flex-col"
        data-testid="home-hero"
      >
        <div className="jx-hero-bg" aria-hidden="true" />
        <div className="jx-hero-content relative z-10 flex flex-1 flex-col items-center justify-center px-4 py-10 md:py-14">
          <p className="jx-section-label text-center text-[var(--jx-gold)] jx-ui-shell">
            {brandHeroLabel()}
          </p>
          <h1 className="jx-hero-title mt-4 text-center text-5xl md:text-7xl lg:text-[5.5rem]">
            静心
          </h1>
          <p className="mx-auto mt-4 max-w-md text-center text-sm tracking-[0.35em] text-[var(--jx-ink-light)] jx-ui-shell md:text-base">
            让佛经更容易读懂
          </p>

          <div className="mt-8 flex w-full justify-center">
            <SearchForm variant="combo" />
          </div>
          <HomePopularChips />
          <HomeStatsBar stats={stats} />
          <HomeFeatureCards compact />
        </div>
      </section>

      <hr className="jx-divider jx-shell" />

      <section className="jx-shell py-8 md:py-12">
        <SectionHeader label="今日经句" accent />
        <DailyVerseCard
          verseText={verseText}
          verseSource={verseSource}
          aiSummary={daily?.aiSummary}
        />
      </section>

      <hr className="jx-divider jx-shell" />

      <section className="jx-shell py-8 md:py-12">
        <SectionHeader label="热门经典" />
        <PopularSutraGrid sutras={popular} />
      </section>

      <hr className="jx-divider jx-shell" />

      <section className="jx-shell pb-12 md:pb-16">
        <SectionHeader label="专题阅读" />
        <TopicTeasers />
      </section>
    </div>
  );
}
