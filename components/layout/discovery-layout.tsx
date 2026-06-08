/**
 * 发现层统一布局
 * @author 代长亚
 */
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { cn } from "@/lib/utils";

export function DiscoveryLayout({
  label,
  title,
  description,
  accent,
  headerExtra,
  sidebar,
  children,
  className,
}: {
  label: string;
  title: string;
  description?: string;
  accent?: boolean;
  headerExtra?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <PageShell variant="fade">
      <PageHeader
        label={label}
        title={title}
        description={description}
        accent={accent}
      />
      {headerExtra}
      {sidebar ? (
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
          <aside className="w-full shrink-0 lg:w-[var(--jx-sidebar-width)]">
            {sidebar}
          </aside>
          <div className={cn("min-w-0 flex-1", className)}>{children}</div>
        </div>
      ) : (
        <div className={className}>{children}</div>
      )}
    </PageShell>
  );
}
