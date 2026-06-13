import { SearchForm } from "@/components/home/search-form";
import { DailyVerseCardWithRefresh } from "@/components/calendar/daily-verse-card-with-refresh";
import { PopularSutraGrid } from "@/components/home/popular-sutra-grid";
import { TopicTeasers } from "@/components/home/topic-teasers";
import { HomeFeatureCards } from "@/components/home/home-feature-cards";
import { HomePopularChips } from "@/components/home/home-popular-chips";
import { HomeStatsBar } from "@/components/home/home-stats-bar";
import { SectionHeader } from "@/components/ui/section-header";
import { listPopularSutras } from "@/lib/search/fts";
import { getSqlite } from "@/lib/db";
import { getCorpusStats } from "@/lib/stats/corpus-stats";
import { brandHeroLabel, getBrandName, getBrandTagline } from "@/lib/brand";
import { resolveDailyVerse } from "@/lib/calendar/daily-verse";
import { resolveCalendarDay } from "@/lib/calendar/resolve-day";
import { getCalendarTodayKey } from "@/lib/calendar/today";

export const revalidate = 3600;

export default function HomePage() {
  getSqlite();
  const stats = getCorpusStats();
  const popular = listPopularSutras(12);
  const todayKey = getCalendarTodayKey();
  const calendarDay = resolveCalendarDay(todayKey);
  const resolvedVerse = resolveDailyVerse(todayKey);

  return (
    <div className="animate-jx-fade">
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
            {getBrandName()}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-center text-sm tracking-[0.35em] text-[var(--jx-ink-light)] jx-ui-shell md:text-base">
            {getBrandTagline()}
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
        <DailyVerseCardWithRefresh
          initial={resolvedVerse}
          calendarDay={calendarDay}
          verseDate={todayKey}
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
