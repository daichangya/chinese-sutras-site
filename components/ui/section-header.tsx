/**
 * 区块标题 + 渐变分隔线
 * @author 代长亚
 */
import { cn } from "@/lib/utils";

export function SectionHeader({
  label,
  className,
  accent,
}: {
  label: string;
  className?: string;
  accent?: boolean;
}) {
  return (
    <div className={cn("mb-6 flex items-center gap-3 jx-ui-shell", className)}>
      <p className={cn("jx-section-label", accent && "text-[var(--jx-gold)]")}>
        {label}
      </p>
      <div className="h-px flex-1 bg-gradient-to-r from-[var(--jx-border)]/40 to-transparent" />
    </div>
  );
}
