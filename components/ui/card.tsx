/**
 * 半透明纸卡
 * @author 代长亚
 */
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  hover,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        hover ? "jx-sutra-card" : "jx-glass-card",
        "jx-ui-shell",
        className,
      )}
    >
      {children}
    </div>
  );
}
