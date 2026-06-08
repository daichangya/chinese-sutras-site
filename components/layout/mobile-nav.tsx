/**
 * 移动端导航（侧滑抽屉 + icon 导航 + active 态）
 * @author 代长亚
 */
"use client";

import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Bookmark,
  Bot,
  FileText,
  GitBranch,
  Home,
  Map,
  Menu,
  Moon,
  ScrollText,
  Search,
  Sun,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTheme } from "@/lib/theme/use-theme";
import { cn } from "@/lib/utils";

const navItems: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/", label: "首页", icon: Home },
  { href: "/canon", label: "经藏", icon: BookOpen },
  { href: "/search", label: "搜索", icon: Search },
  { href: "/dictionary", label: "辞典", icon: ScrollText },
  { href: "/kg", label: "图谱", icon: GitBranch },
  { href: "/places", label: "地理", icon: Map },
  { href: "/bookmarks", label: "收藏", icon: Bookmark },
  { href: "/chat", label: "AI 问经", icon: Bot },
  { href: "/about", label: "关于", icon: FileText },
];

function isNavActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          className="flex md:hidden items-center justify-center rounded-md p-2.5 text-[var(--foreground)] hover:bg-[var(--jx-paper-deep)] transition-colors cursor-pointer"
          aria-label="打开导航菜单"
          aria-haspopup="dialog"
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <Menu className="size-5" aria-hidden="true" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] data-[state=open]:animate-overlay-show data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />

        <Dialog.Content
          className="fixed top-0 right-0 bottom-0 w-72 max-w-[85vw] bg-[var(--jx-paper)] shadow-xl
                     data-[state=open]:animate-content-slide-in
                     data-[state=closed]:animate-content-slide-out
                     focus:outline-none jx-ui-shell"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between border-b border-[var(--jx-border)] px-5 py-4">
            <Link
              href="/"
              className="jx-hero-title text-xl tracking-[0.15em] text-[var(--jx-ink-classical)]"
            >
              静心
            </Link>
            <Dialog.Close asChild>
              <button
                className="flex items-center justify-center rounded-md p-2.5 text-[var(--jx-muted-label)] hover:bg-[var(--jx-paper-deep)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
                aria-label="关闭导航菜单"
                style={{ minWidth: 44, minHeight: 44 }}
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </Dialog.Close>
          </div>

          <nav className="flex flex-col py-2" role="navigation" aria-label="移动端导航">
            {navItems.map((item) => {
              const active = isNavActive(pathname, item.href);
              return (
                <Dialog.Close asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3.5 text-base transition-colors min-h-[44px] cursor-pointer",
                      active
                        ? "bg-[rgb(139_37_0/0.08)] text-[var(--jx-accent-cinnabar)] font-medium"
                        : "text-[var(--foreground)] hover:bg-[var(--jx-paper-deep)]",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    <item.icon className="size-4 shrink-0 opacity-70" aria-hidden="true" />
                    {item.label}
                  </Link>
                </Dialog.Close>
              );
            })}

            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-3 px-5 py-3.5 text-base text-[var(--foreground)] hover:bg-[var(--jx-paper-deep)] transition-colors min-h-[44px] cursor-pointer"
              aria-label={theme === "dark" ? "切换日间模式" : "切换暗色模式"}
            >
              {theme === "dark" ? (
                <Sun className="size-5" aria-hidden="true" />
              ) : (
                <Moon className="size-5" aria-hidden="true" />
              )}
              {theme === "dark" ? "日间模式" : "暗色模式"}
            </button>
          </nav>

          <div className="absolute bottom-6 left-0 right-0 px-5 text-center text-xs text-[var(--jx-muted-label)]">
            让佛经更容易读懂
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
