/**
 * 筛选 pill 容器
 * @author 代长亚
 */
import { cn } from "@/lib/utils";

export function FilterBar({
  children,
  className,
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div className={cn("mb-6", className)}>
      {label ? (
        <p className="jx-section-label mb-3">{label}</p>
      ) : null}
      <div
        className="flex flex-wrap gap-2 overflow-x-auto pb-1"
        role="group"
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}
