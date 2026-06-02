/**
 * 站点顶栏（Notion 式轻量 + 无尽藏式纸色温度）
 * @author jingxin
 */
import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--jx-border)] bg-[var(--background)]/90 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-semibold tracking-wide text-[var(--foreground)]"
        >
          {/* 小 logo 装饰 */}
          <span className="text-lg opacity-40">◎</span>
          <span>静心</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-[var(--jx-muted-label)]">
          <Link href="/search" className="transition-colors hover:text-[var(--foreground)]">
            搜索
          </Link>
          <Link href="/bookmarks" className="transition-colors hover:text-[var(--foreground)]">
            收藏
          </Link>
          <Link href="/about" className="transition-colors hover:text-[var(--foreground)]">
            关于
          </Link>
        </nav>
      </div>
    </header>
  );
}
