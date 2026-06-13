"use client";

/**
 * 站点顶栏（FoJin 对齐：52px、icon + 文字导航、首页透明）
 * @author 代长亚
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Bookmark,
  Bot,
  CalendarDays,
  FileText,
  GitBranch,
  Map,
  Moon,
  ScrollText,
  Search,
  Sun,
} from "lucide-react";
import { IconNavLink } from "./icon-nav-link";
import { MobileNav } from "./mobile-nav";
import { UserMenu } from "@/components/auth/user-menu";
import { BuddhistDateChip } from "@/components/calendar/buddhist-date-chip";
import { useBrand } from "@/components/layout/brand-provider";
import { useTheme } from "@/lib/theme/use-theme";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { brandName, calendarDay } = useBrand();
  const isHome = pathname === "/";
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) {
      setScrolled(false);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors jx-ui-shell",
        isHome
          ? scrolled
            ? "border-[var(--jx-border)]/30 bg-[var(--background)]/90 backdrop-blur-md"
            : "border-transparent bg-[var(--background)]/70 backdrop-blur-md"
          : "border-[var(--jx-border)]/30 bg-[var(--background)]/90 backdrop-blur-md",
      )}
      style={{ height: "var(--jx-header-height)" }}
    >
      <div className="jx-shell flex h-full items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href="/"
            className="jx-hero-title flex items-center gap-2 text-xl tracking-[0.15em] text-[var(--jx-ink-classical)] md:text-2xl shrink-0"
            aria-label={`${brandName} - 返回首页`}
          >
            {brandName}
          </Link>
          {calendarDay && (
            <BuddhistDateChip day={calendarDay} compact className="min-w-0" />
          )}
        </div>

        <nav
          className="hidden md:flex items-center gap-4 text-sm"
          aria-label="桌面端主导航"
        >
          <IconNavLink href="/calendar" icon={CalendarDays} label="佛历" />
          <IconNavLink href="/canon" icon={BookOpen} label="经藏" />
          <IconNavLink href="/search" icon={Search} label="搜索" />
          <IconNavLink href="/dictionary" icon={ScrollText} label="辞典" />
          <IconNavLink href="/kg" icon={GitBranch} label="图谱" />
          <IconNavLink href="/places" icon={Map} label="地理" />
          <IconNavLink href="/bookmarks" icon={Bookmark} label="收藏" />
          <IconNavLink href="/chat" icon={Bot} label="AI 问经" />
          <IconNavLink href="/about" icon={FileText} label="关于" />
          <UserMenu />
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center justify-center rounded-md p-1.5 text-[var(--jx-muted-label)] hover:bg-[var(--jx-paper-deep)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
            aria-label={theme === "dark" ? "切换日间模式" : "切换暗色模式"}
          >
            {theme === "dark" ? (
              <Sun className="size-4" aria-hidden="true" />
            ) : (
              <Moon className="size-4" aria-hidden="true" />
            )}
          </button>
        </nav>

        <MobileNav />
      </div>
    </header>
  );
}
