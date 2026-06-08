/**
 * 发现层统一页头
 * @author 代长亚
 */
import { cn } from "@/lib/utils";

export function PageHeader({
  label,
  title,
  description,
  accent,
  className,
}: {
  label: string;
  title: string;
  description?: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <header className={cn("mb-8 md:mb-10", className)}>
      <p
        className={cn(
          "jx-section-label",
          accent && "text-[var(--jx-gold)]",
        )}
      >
        {label}
      </p>
      <h1 className="mt-3 text-2xl font-medium tracking-wide text-[var(--jx-ink-classical)] md:text-3xl">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
          {description}
        </p>
      ) : null}
    </header>
  );
}
