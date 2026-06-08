/**
 * 顶栏 icon + 文字导航链接（含 active 态）
 * @author 代长亚
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function IconNavLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "inline-flex flex-col items-center gap-0.5 transition-colors hover:text-[var(--foreground)] cursor-pointer",
        isActive ? "jx-nav-active text-[var(--jx-ink-classical)]" : "text-[var(--jx-muted-label)]",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="inline-flex items-center gap-1.5">
        <Icon className="size-3.5 shrink-0 opacity-70 xl:hidden" aria-hidden="true" />
        <span>{label}</span>
      </span>
    </Link>
  );
}
