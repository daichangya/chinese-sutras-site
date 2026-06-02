/**
 * 首页今日经句卡片 — 无尽藏式沉浸引述框
 * @author jingxin
 */
import Link from "next/link";

export function DailyVerseCard({
  verseText,
  verseSource,
  aiSummary,
}: {
  verseText: string;
  verseSource: string;
  aiSummary?: string | null;
}) {
  return (
    <div
      data-testid="daily-verse-card"
      className="share-card relative overflow-hidden rounded-2xl border border-[var(--jx-border)] bg-gradient-to-br from-[var(--jx-paper-elevated)] via-[var(--jx-paper)] to-amber-50/60 dark:from-[var(--jx-dark-surface)] dark:via-[var(--jx-dark-bg)] dark:to-stone-950 p-8 md:p-10"
    >
      {/* 装饰角标 */}
      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04] dark:opacity-[0.06]">
        <svg viewBox="0 0 100 100" fill="currentColor" className="text-[var(--jx-accent)]">
          <path d="M20,20 L80,20 L80,80 L20,80 Z" fill="none" stroke="currentColor" strokeWidth="2"/>
          <path d="M30,30 L70,30 L70,70 L30,70 Z" fill="none" stroke="currentColor" strokeWidth="1"/>
          <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="1"/>
        </svg>
      </div>

      {/* 标签 */}
      <div className="flex items-center gap-2 mb-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium tracking-wider text-amber-800/80 dark:text-amber-400/80">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 animate-pulse" />
          今日经句
        </span>
        <span className="text-xs text-[var(--jx-muted-label)]">
          {new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric" })}
        </span>
      </div>

      {/* 经文引述 */}
      <blockquote className="relative text-xl md:text-2xl font-medium leading-relaxed tracking-wide text-[var(--jx-ink)] dark:text-stone-100">
        <span className="absolute -left-1 -top-2 text-4xl text-[var(--jx-accent)] opacity-20 font-serif leading-none">"</span>
        {verseText}
        <span className="text-4xl text-[var(--jx-accent)] opacity-20 font-serif leading-none">"</span>
      </blockquote>

      {/* 出处 */}
      {verseSource && (
        <p className="mt-4 text-sm text-[var(--muted)] flex items-center gap-1.5">
          <span className="text-[var(--jx-border-strong)]">—</span>
          {verseSource}
        </p>
      )}

      {/* AI 解读 */}
      {aiSummary && (
        <div className="mt-6 pt-6 border-t border-[var(--jx-border)]">
          <p className="text-xs font-medium text-[var(--jx-muted-label)] mb-2 tracking-wider">
            AI 短解读
          </p>
          <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            {aiSummary}
          </p>
        </div>
      )}

      {/* 操作 */}
      <Link
        href="/verse/today"
        className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-amber-900/90 underline-offset-4 hover:underline dark:text-amber-400/90 transition-colors"
      >
        分享今日经句
        <span className="text-lg leading-none">→</span>
      </Link>
    </div>
  );
}
