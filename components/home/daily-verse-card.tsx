/**
 * 首页今日经句卡片 — 无尽藏式沉浸引述框
 * @author 代长亚
 */
import Link from "next/link";
import { BuddhistDateChip } from "@/components/calendar/buddhist-date-chip";
import { FestivalTierBadge } from "@/components/calendar/festival-tier-badge";
import { hasMajorFestival, primaryFestival } from "@/components/calendar/calendar-utils";
import type { CalendarDay } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

export function DailyVerseCard({
  verseText,
  verseSource,
  aiSummary,
  calendarDay,
  label = "今日经句",
  aiRecommended = false,
  pendingAi = false,
}: {
  verseText: string;
  verseSource: string;
  aiSummary?: string | null;
  calendarDay?: CalendarDay;
  label?: string;
  aiRecommended?: boolean;
  pendingAi?: boolean;
}) {
  const majorFestival = calendarDay ? primaryFestival(calendarDay) : undefined;
  const isMajorDay = calendarDay ? hasMajorFestival(calendarDay) : false;

  return (
    <div
      data-testid="daily-verse-card"
      className={cn(
        "share-card relative overflow-hidden rounded-xl md:rounded-2xl border border-[var(--jx-border)] bg-gradient-to-br from-[var(--jx-paper-elevated)] via-[var(--jx-paper)] to-[rgb(139_37_0/0.04)] dark:from-[var(--jx-dark-surface)] dark:via-[var(--jx-dark-bg)] dark:to-stone-950 p-6 md:p-10",
        isMajorDay && "border-t-2 border-t-[var(--jx-gold)]/55",
      )}
    >
      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04] dark:opacity-[0.06]">
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-[var(--jx-accent)]" aria-hidden>
          <path d="M20,20 L80,20 L80,80 L20,80 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M30,30 L70,30 L70,70 L30,70 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
          <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="1"/>
        </svg>
      </div>

      {isMajorDay && (
        <div className="absolute top-3 left-3 h-8 w-8 opacity-[0.07] dark:opacity-[0.1]" aria-hidden>
          <svg viewBox="0 0 32 32" fill="none" className="text-[var(--jx-gold)]">
            <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="1" />
            <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="0.75" />
          </svg>
        </div>
      )}

      <div className="flex flex-col gap-2 mb-5 md:flex-row md:flex-wrap md:items-center md:gap-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wider text-[var(--jx-accent-cinnabar)]/80 dark:text-[var(--jx-gold)]/80">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--jx-accent-cinnabar)]/60 animate-pulse" />
          {label}
        </span>
        {majorFestival && isMajorDay && (
          <FestivalTierBadge tier="major" label={majorFestival.name} />
        )}
        {calendarDay && <BuddhistDateChip day={calendarDay} />}
        {aiRecommended && (
          <span className="text-[10px] text-[var(--jx-muted-label)]">AI 依节日推荐</span>
        )}
        {pendingAi && (
          <div className="flex flex-col gap-1" aria-label="正在生成节日解读">
            <span className="h-2 w-20 rounded bg-[var(--jx-border)]/70 animate-pulse" />
            <span className="h-2 w-28 rounded bg-[var(--jx-border)]/50 animate-pulse" />
          </div>
        )}
      </div>

      <blockquote className="relative text-xl md:text-2xl font-medium leading-relaxed tracking-wide text-[var(--jx-ink)] dark:text-stone-100">
        <span className="absolute -left-1 -top-2 text-4xl text-[var(--jx-accent)] opacity-20 font-serif leading-none">"</span>
        {verseText}
        <span className="text-4xl text-[var(--jx-accent)] opacity-20 font-serif leading-none">"</span>
      </blockquote>

      {verseSource && (
        <p className="mt-4 text-sm text-[var(--muted)] flex items-center gap-1.5">
          <span className="text-[var(--jx-border-strong)]">—</span>
          {verseSource}
        </p>
      )}

      {aiSummary && (
        <div className="mt-6 pt-6 border-t border-[var(--jx-border)]">
          <p className="text-xs font-medium text-[var(--jx-muted-label)] mb-2 tracking-wider">
            AI 短解读
          </p>
          <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {aiSummary}
          </p>
        </div>
      )}

      <Link
        href="/verse/today"
        className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-[var(--jx-accent-cinnabar)]/90 underline-offset-4 hover:underline dark:text-[var(--jx-gold)]/90 transition-colors cursor-pointer"
      >
        分享今日经句
        <span className="text-lg leading-none">→</span>
      </Link>
    </div>
  );
}
