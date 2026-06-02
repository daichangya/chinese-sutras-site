import type { Metadata } from "next";
import Link from "next/link";
import { getSqlite } from "@/lib/db";
import { getDailyVerse, getParagraphById } from "@/lib/sutra/queries";
import { getSutraBySlug } from "@/lib/sutra/queries";
import { listPopularSutras } from "@/lib/search/fts";

export const dynamic = "force-dynamic";

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export async function generateMetadata(): Promise<Metadata> {
  getSqlite();
  const daily = getDailyVerse(todayKey());
  const text = daily?.customText ?? "凡所有相，皆是虚妄。";
  const description = text.slice(0, 120);
  return {
    title: `今日经句 | 静心`,
    description,
    openGraph: {
      title: "今日经句 · 静心",
      description,
      type: "website",
      images: [{ url: "/verse/today/opengraph-image", width: 1200, height: 630 }],
    },
  };
}

export default function VerseTodayPage() {
  getSqlite();
  const daily = getDailyVerse(todayKey());
  let verseText = daily?.customText ?? "凡所有相，皆是虚妄。若见诸相非相，则见如来。";
  let sutraTitle = "";
  let sutraSlug = "xinjing";

  if (daily?.paragraphId) {
    const p = getParagraphById(daily.paragraphId);
    if (p) {
      verseText = p.text.slice(0, 200);
      const popular = listPopularSutras(20);
      const s = popular.find((x) => x.id === p.sutraId);
      if (s) {
        sutraTitle = s.title;
        sutraSlug = s.slug;
      }
    }
  } else {
    const xinjing = getSutraBySlug("xinjing");
    if (xinjing) sutraTitle = xinjing.title;
  }

  return (
    <div className="jx-page animate-jx-fade">
      {/* 经句卡片 */}
      <div className="share-card rounded-2xl border border-[#dcc9a0] bg-gradient-to-br from-[var(--jx-paper-elevated)] via-[var(--jx-paper)] to-amber-50/60 p-10 text-center dark:border-amber-900/40 dark:from-stone-900 dark:to-stone-950">
        <p className="jx-section-label text-amber-800/80 dark:text-amber-400/80 mb-6">今日经句</p>
        <blockquote className="text-2xl md:text-3xl font-normal leading-relaxed tracking-wide text-[var(--jx-ink)] dark:text-stone-100">
          {verseText}
        </blockquote>
        {sutraTitle && (
          <p className="mt-6 text-sm text-[var(--muted)] italic flex items-center justify-center gap-2">
            <span className="w-4 h-px bg-[var(--jx-border)]" />
            {sutraTitle}
            <span className="w-4 h-px bg-[var(--jx-border)]" />
          </p>
        )}
        {daily?.aiSummary && (
          <div className="mt-8 pt-6 border-t border-[var(--jx-border)] text-left">
            <p className="text-xs font-medium text-[var(--jx-muted-label)] mb-2 tracking-wider">AI 短解读</p>
            <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
              {daily.aiSummary}
            </p>
          </div>
        )}
        <p className="mt-8 text-xs text-[var(--jx-muted-label)]">静心 · jingxin</p>
      </div>

      {/* 操作链接 */}
      <div className="mt-10 flex flex-col items-center gap-5">
        <Link
          href={`/sutra/${sutraSlug}`}
          className="text-lg font-medium text-[var(--jx-accent)] hover:underline underline-offset-4 transition-colors"
        >
          阅读全文 →
        </Link>
        <Link
          href="/"
          className="text-sm text-[var(--jx-muted-label)] hover:text-[var(--foreground)] underline underline-offset-4 transition-colors"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
