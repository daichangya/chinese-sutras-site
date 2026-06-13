/**
 * 选中日详情侧栏
 * @author 代长亚
 */
import Link from "next/link";
import { BookOpen, Sparkles } from "lucide-react";
import { getFestivalSutraRef } from "@/lib/calendar/festival-sutra-registry";
import type { CalendarDay } from "@/lib/calendar/types";
import { FestivalTierBadge } from "./festival-tier-badge";

export function CalendarDayDetail({
  day,
  isToday,
  importedSutraSlugs,
}: {
  day: CalendarDay;
  isToday: boolean;
  importedSutraSlugs: string[];
}) {
  const imported = new Set(importedSutraSlugs);
  const major = day.festivals.find((f) => f.tier === "major");

  return (
    <div
      className="jx-glass-card rounded-xl p-5 lg:sticky lg:top-[calc(var(--jx-header-height)+1rem)]"
      data-testid="calendar-day-detail"
    >
      <p className="jx-section-label text-[var(--jx-gold)]">选中日</p>
      <h2 className="mt-2 text-lg font-medium text-[var(--foreground)]">
        {day.gregorianYear}年{day.gregorianMonth}月{day.gregorianDay}日
      </h2>
      <p className="mt-2 text-sm text-[var(--jx-muted-label)]">
        农历 {day.lunar.monthLabel}月{day.lunar.dayLabel}
        {day.lunar.isLeapMonth ? "（闰月）" : ""}
        {" · "}
        佛历{day.buddhistYear}年
      </p>

      {(day.isSixFastingDay || day.isTenFastingDay) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {day.isSixFastingDay && (
            <span className="rounded-full border border-[var(--jx-accent-cinnabar)]/30 bg-[var(--jx-accent-cinnabar)]/5 px-2.5 py-0.5 text-xs text-[var(--jx-accent-cinnabar)] dark:text-[var(--jx-gold)]">
              六斋日
            </span>
          )}
          {day.isTenFastingDay && (
            <span className="rounded-full border border-[var(--jx-accent-cinnabar)]/30 bg-[var(--jx-accent-cinnabar)]/5 px-2.5 py-0.5 text-xs text-[var(--jx-accent-cinnabar)] dark:text-[var(--jx-gold)]">
              十斋日
            </span>
          )}
        </div>
      )}

      {day.festivals.length > 0 ? (
        <ul className="mt-5 space-y-3">
          {day.festivals.map((f) => {
            const sutraLinks = (f.relatedSutras ?? [])
              .map((slug) => {
                const ref = getFestivalSutraRef(slug);
                if (!ref || !imported.has(slug)) return null;
                return { slug: ref.slug, title: ref.title };
              })
              .filter(Boolean) as Array<{ slug: string; title: string }>;

            return (
              <li
                key={f.id}
                className="rounded-lg border border-[var(--jx-border)]/70 bg-[var(--jx-paper-elevated)]/50 p-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-[var(--foreground)]">{f.name}</span>
                  <FestivalTierBadge tier={f.tier} />
                </div>
                {f.aiTheme && (
                  <p className="mt-2 text-xs leading-relaxed text-[var(--jx-muted-label)]">
                    {f.aiTheme}
                  </p>
                )}
                {sutraLinks.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {sutraLinks.map((s) => (
                      <Link
                        key={s.slug}
                        href={`/sutra/${s.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs text-[var(--jx-accent-cinnabar)] hover:underline underline-offset-4 dark:text-[var(--jx-gold)] transition-colors cursor-pointer"
                      >
                        <BookOpen className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        {s.title}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-[var(--jx-muted-label)]">此日无标注节日</p>
      )}

      {major && isToday && (
        <Link
          href="/verse/today"
          className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-[var(--jx-gold)]/40 bg-[var(--jx-gold)]/8 px-3 py-2 text-sm font-medium text-[var(--jx-accent-cinnabar)] transition-colors duration-200 hover:bg-[var(--jx-gold)]/15 dark:text-[var(--jx-gold)] cursor-pointer"
        >
          <Sparkles className="h-4 w-4" aria-hidden />
          {major.name} · 今日经句
        </Link>
      )}
    </div>
  );
}
