/**
 * 阅读器工具栏图标按钮
 * @author 代长亚
 */
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function ToolIconButton({
  icon: Icon,
  label,
  text,
  active = false,
  onClick,
  href,
  disabled,
  testId,
}: {
  icon: LucideIcon;
  label: string;
  text?: string;
  active?: boolean;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  testId?: string;
}) {
  const displayText = text ?? label;
  const className = cn(
    "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 transition-colors",
    active
      ? "border-[var(--jx-accent-cinnabar)] bg-[var(--jx-accent-cinnabar)]/10 text-[var(--jx-accent-cinnabar)]"
      : "border-[var(--jx-border)] text-[var(--muted)] hover:border-[var(--jx-border-strong)] hover:bg-[var(--jx-paper-deep)] hover:text-[var(--foreground)]",
    disabled && "pointer-events-none opacity-40",
  );

  const content = (
    <>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <span className="text-xs">{displayText}</span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={className}
        aria-label={label}
        data-testid={testId}
        title={label}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      className={className}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      title={label}
    >
      {content}
    </button>
  );
}
