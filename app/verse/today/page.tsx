import type { Metadata } from "next";
import Link from "next/link";
import { BuddhistDateChip } from "@/components/calendar/buddhist-date-chip";
import { FestivalTierBadge } from "@/components/calendar/festival-tier-badge";
import { hasMajorFestival } from "@/components/calendar/calendar-utils";
import { getSqlite } from "@/lib/db";
import { getSutraBySlug } from "@/lib/sutra/queries";
import { brandInlineLabel, getBrandName } from "@/lib/brand";
import { resolveDailyVerse } from "@/lib/calendar/daily-verse";
import { resolveCalendarDay } from "@/lib/calendar/resolve-day";
import { getCalendarTodayKey } from "@/lib/calendar/today";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  getSqlite();
  const todayKey = getCalendarTodayKey();
  const resolved = resolveDailyVerse(todayKey);
  const description = resolved.verseText.slice(0, 120);
  const brandName = getBrandName();
  const titlePrefix = resolved.festival ? `${resolved.festival.name} · 今日经句` : "今日经句";
  return {
    title: `${titlePrefix} | ${brandName}`,
    description,
    openGraph: {
      title: `${titlePrefix} · ${brandName}`,
      description,
      type: "website",
      images: [{ url: "/verse/today/opengraph-image", width: 1200, height: 630 }],
    },
  };
}

export default function VerseTodayPage() {
  getSqlite();
  const todayKey = getCalendarTodayKey();
  const calendarDay = resolveCalendarDay(todayKey);
  const resolved = resolveDailyVerse(todayKey);
  const label = resolved.festival ? `${resolved.festival.name} · 今日经句` : "今日经句";
  const isMajorDay = hasMajorFestival(calendarDay);

  let sutraSlug = "xinjing";
  if (resolved.paragraphId) {
    const db = getSqlite();
    const row = db
      .prepare(
        `SELECT s.slug FROM paragraph p JOIN sutra s ON s.id = p.sutra_id WHERE p.id = ?`,
      )
      .get(resolved.paragraphId) as { slug: string } | undefined;
    if (row) sutraSlug = row.slug;
  } else {
    const xinjing = getSutraBySlug("xinjing");
    if (xinjing && !resolved.verseSource) {
      /* keep default slug */
    }
  }

  const calendarHref = `/calendar?year=${calendarDay.gregorianYear}&month=${calendarDay.gregorianMonth}#today`;

  return (
    <div className="jx-page animate-jx-fade">
      <div
        className={cn(
          "share-card rounded-xl md:rounded-2xl border border-[#dcc9a0] bg-gradient-to-br from-[var(--jx-paper-elevated)] via-[var(--jx-paper)] to-[rgb(139_37_0/0.04)] p-6 md:p-10 text-center dark:border-[var(--jx-border)]/40 dark:from-stone-900 dark:to-stone-950",
          isMajorDay && "border-t-2 border-t-[var(--jx-gold)]/55",
        )}
      >
        <div className="mb-4 flex flex-col items-center gap-2">
          <p className="jx-section-label text-[var(--jx-accent-cinnabar)]/80 dark:text-[var(--jx-gold)]/80">
            {label}
          </p>
          {resolved.festival && isMajorDay && (
            <FestivalTierBadge tier="major" label={resolved.festival.name} />
          )}
          <BuddhistDateChip day={calendarDay} />
          {resolved.aiRecommended && (
            <p className="text-[10px] text-[var(--jx-muted-label)]">AI 依节日推荐</p>
          )}
        </div>
        <blockquote className="text-xl md:text-3xl font-normal leading-relaxed tracking-wide text-[var(--jx-ink)] dark:text-stone-100">
          {resolved.verseText}
        </blockquote>
        {resolved.verseSource && (
          <p className="mt-6 text-sm text-[var(--muted)] italic flex items-center justify-center gap-2">
            <span className="w-4 h-px bg-[var(--jx-border)]" />
            {resolved.verseSource}
            <span className="w-4 h-px bg-[var(--jx-border)]" />
          </p>
        )}
        {resolved.aiSummary && (
          <div className="mt-8 pt-6 border-t border-[var(--jx-border)] text-left">
            <p className="text-xs font-medium text-[var(--jx-muted-label)] mb-2 tracking-wider">AI 短解读</p>
            <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              {resolved.aiSummary}
            </p>
          </div>
        )}
        <p className="mt-8 text-xs text-[var(--jx-muted-label)]">{brandInlineLabel()}</p>
      </div>

      <div className="mt-10 flex flex-col items-center gap-5">
        <Link
          href={`/sutra/${sutraSlug}`}
          className="text-lg font-medium text-[var(--jx-accent)] hover:underline underline-offset-4 transition-colors cursor-pointer"
        >
          阅读全文 →
        </Link>
        <Link
          href={calendarHref}
          className="text-sm text-[var(--jx-muted-label)] hover:text-[var(--foreground)] underline underline-offset-4 transition-colors cursor-pointer"
        >
          {isMajorDay ? "查看本月佛历" : "查看佛历"}
        </Link>
        <Link
          href="/"
          className="text-sm text-[var(--jx-muted-label)] hover:text-[var(--foreground)] underline underline-offset-4 transition-colors cursor-pointer"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
