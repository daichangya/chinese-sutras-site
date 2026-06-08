/**
 * 统一页面容器
 * @author 代长亚
 */
import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
  narrow,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
  variant?: "default" | "fade";
}) {
  return (
    <div
      className={cn(
        narrow ? "jx-page" : "jx-page jx-ui-shell",
        variant === "fade" && "animate-jx-fade",
        className,
      )}
    >
      {children}
    </div>
  );
}
