/**
 * 节日 tier 徽章（全站佛历触点复用）
 * @author 代长亚
 */
import type { FestivalTier } from "@/lib/calendar/types";
import { cn } from "@/lib/utils";

export function FestivalTierBadge({
  tier,
  label,
  className,
}: {
  tier: FestivalTier;
  label?: string;
  className?: string;
}) {
  const text = label ?? (tier === "major" ? "重要节日" : "节日");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide",
        tier === "major"
          ? "bg-[var(--jx-gold)]/15 text-[var(--jx-accent-cinnabar)] dark:text-[var(--jx-gold)]"
          : "border border-[var(--jx-border)] text-[var(--jx-muted-label)]",
        className,
      )}
    >
      {text}
    </span>
  );
}
