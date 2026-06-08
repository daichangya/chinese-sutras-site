/**
 * 筛选/标签 Chip
 * @author 代长亚
 */
import { cn } from "@/lib/utils";

export function Chip({
  children,
  active,
  size = "md",
  variant = "default",
  className,
  onClick,
  as: Comp = "button",
  ...props
}: {
  children: React.ReactNode;
  active?: boolean;
  size?: "sm" | "md";
  variant?: "default" | "filter";
  className?: string;
  onClick?: () => void;
  as?: "button" | "span";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cn(
    "jx-chip",
    active && variant === "default" && "jx-chip--active",
    active &&
      variant === "filter" &&
      "border-[var(--jx-accent-cinnabar)] bg-[var(--jx-accent-cinnabar)] text-white",
    size === "sm" && "px-2.5 py-0.5 text-xs",
    size === "md" && "px-3 py-1.5 text-sm",
    className,
  );

  if (Comp === "span") {
    return <span className={cls}>{children}</span>;
  }

  return (
    <button type="button" className={cls} onClick={onClick} {...props}>
      {children}
    </button>
  );
}
