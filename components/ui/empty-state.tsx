/**
 * 空状态（Lucide 图标，禁止 emoji）
 * @author 代长亚
 */
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--jx-border)] bg-[var(--jx-paper-deep)]/50 px-6 py-12 text-center jx-ui-shell",
        className,
      )}
    >
      <Icon
        className="mb-4 size-10 text-[var(--jx-muted-label)]"
        aria-hidden="true"
      />
      <p className="text-base font-medium text-[var(--foreground)]">{title}</p>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">{description}</p>
      ) : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
