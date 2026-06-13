/**
 * 佛历日期轻量展示（纸感胶囊 Chip / 手机副栏）
 * @author 代长亚
 */
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import type { CalendarDay } from "@/lib/calendar/types";
import { formatGregorianLabel } from "@/lib/calendar/lunar";
import { cn } from "@/lib/utils";
import { FestivalTierBadge } from "./festival-tier-badge";
import { primaryFestival } from "./calendar-utils";

export type BuddhistDateChipPlacement = "card" | "inline" | "subbar";

function fastingLabel(day: CalendarDay): string | null {
  if (day.isSixFastingDay) return "六斋日";
  if (day.isTenFastingDay) return "十斋日";
  return null;
}

function dateParts(day: CalendarDay, placement: BuddhistDateChipPlacement): string[] {
  if (placement === "inline") {
    return [`${day.lunar.monthLabel}月${day.lunar.dayLabel}`, `佛历${day.buddhistYear}年`];
  }
  if (placement === "subbar") {
    return [`农历${day.lunar.monthLabel}月${day.lunar.dayLabel}`, `佛历${day.buddhistYear}年`];
  }
  return [
    formatGregorianLabel(day.isoDate),
    `${day.lunar.monthLabel}月${day.lunar.dayLabel}`,
    `佛历${day.buddhistYear}年`,
  ];
}

function festivalLabel(name: string, placement: BuddhistDateChipPlacement): string {
  if (placement === "inline") {
    return name.replace(/（.*?）/g, "").slice(0, 6);
  }
  return name.replace(/（.*?）/g, "");
}

export function BuddhistDateChip({
  day,
  placement = "card",
  /** @deprecated 使用 placement="inline" */
  compact = false,
  className,
}: {
  day: CalendarDay;
  placement?: BuddhistDateChipPlacement;
  compact?: boolean;
  className?: string;
}) {
  const resolvedPlacement: BuddhistDateChipPlacement = compact ? "inline" : placement;
  const festival = primaryFestival(day);
  const fasting = fastingLabel(day);
  const parts = dateParts(day, resolvedPlacement);

  if (resolvedPlacement === "subbar") {
    return (
      <Link
        href="/calendar#today"
        data-testid="buddhist-date-chip"
        className={cn("jx-calendar-sub-bar", className)}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[var(--jx-gold)]" aria-hidden />
          <span className="truncate">{parts.join(" · ")}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {fasting && (
            <span className="text-[10px] font-medium text-[var(--jx-accent-cinnabar)] dark:text-[var(--jx-gold)]">
              {fasting}
            </span>
          )}
          {festival && (
            <FestivalTierBadge
              tier={festival.tier}
              label={festivalLabel(festival.name, resolvedPlacement)}
              className="max-w-[10rem] truncate"
            />
          )}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href="/calendar#today"
      data-testid="buddhist-date-chip"
      className={cn(
        "max-w-full text-xs text-[var(--jx-muted-label)] hover:text-[var(--foreground)]",
        resolvedPlacement === "inline" ? "jx-chip max-md:!hidden py-1" : "jx-chip",
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
          label={festivalLabel(festival.name, resolvedPlacement)}
          className="shrink-0 max-w-[8rem] truncate"
        />
      )}
    </Link>
  );
}
