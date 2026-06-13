/**
 * 佛历日期轻量展示（纸感胶囊 Chip）
 * @author 代长亚
 */
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { CalendarDay } from "@/lib/calendar/types";
import { formatGregorianLabel } from "@/lib/calendar/lunar";
import { cn } from "@/lib/utils";
import { FestivalTierBadge } from "./festival-tier-badge";
import { primaryFestival } from "./calendar-utils";

function fastingLabel(day: CalendarDay): string | null {
  if (day.isSixFastingDay) return "六斋日";
  if (day.isTenFastingDay) return "十斋日";
  return null;
}

export function BuddhistDateChip({
  day,
  compact = false,
  className,
}: {
  day: CalendarDay;
  compact?: boolean;
  className?: string;
}) {
  const festival = primaryFestival(day);
  const fasting = fastingLabel(day);

  const parts = compact
    ? [`${day.lunar.monthLabel}月${day.lunar.dayLabel}`, `佛历${day.buddhistYear}年`]
    : [
        formatGregorianLabel(day.isoDate),
        `${day.lunar.monthLabel}月${day.lunar.dayLabel}`,
        `佛历${day.buddhistYear}年`,
      ];

  return (
    <Link
      href="/calendar#today"
      data-testid="buddhist-date-chip"
      className={cn(
        "jx-chip max-w-full text-xs text-[var(--jx-muted-label)] hover:text-[var(--foreground)]",
        compact && "hidden md:inline-flex py-1",
        className,
      )}
    >
      <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[var(--jx-gold)]" aria-hidden />
      <span className="truncate">{parts.join(" · ")}</span>
      {fasting && (
        <span className="shrink-0 rounded-full border border-[var(--jx-accent-cinnabar)]/25 px-1.5 py-0.5 text-[9px] text-[var(--jx-accent-cinnabar)] dark:text-[var(--jx-gold)]">
          {fasting}
        </span>
      )}
      {festival && (
        <FestivalTierBadge
          tier={festival.tier}
          label={compact ? festival.name.replace(/（.*?）/g, "").slice(0, 6) : festival.name}
          className="shrink-0 max-w-[8rem] truncate"
        />
      )}
    </Link>
  );
}
