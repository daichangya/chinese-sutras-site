/**
 * 首页专题入口 — 大藏经AI式专题卡片
 * @author 代长亚
 */
import Link from "next/link";

const TOPICS = [
  {
    slug: "kongxing",
    title: "空性",
    icon: "◎",
    desc: "从心经、金刚经入门「空」",
    accent: "from-[rgb(139_37_0/0.04)] to-[rgb(176_141_87/0.08)] dark:from-[rgb(196_74_42/0.12)] dark:to-stone-900/50",
    border: "border-[var(--jx-border)]/60 dark:border-[var(--jx-accent-cinnabar)]/40",
    label: "text-[var(--jx-accent-cinnabar)]/80 dark:text-[var(--jx-gold)]/80",
  },
  {
    slug: "jingtu",
    title: "净土",
    icon: "❋",
    desc: "弥陀愿力与三经一论",
    accent: "from-sky-50 to-blue-50/50 dark:from-sky-950/30 dark:to-stone-900/50",
    border: "border-sky-200/60 dark:border-sky-800/40",
    label: "text-sky-800/80 dark:text-sky-400/80",
  },
  {
    slug: "chan",
    title: "禅宗",
    icon: "☸",
    desc: "六祖坛经与禅门要旨",
    accent: "from-stone-50 to-[rgb(139_37_0/0.03)] dark:from-stone-900/50 dark:to-[rgb(196_74_42/0.08)]",
    border: "border-stone-200/60 dark:border-stone-700/40",
    label: "text-stone-700/80 dark:text-stone-300/80",
  },
];

export function TopicTeasers() {
  return (
    <div data-testid="topic-teasers" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {TOPICS.map((t, idx) => (
        <Link
          key={t.slug}
          href={`/topic/${t.slug}`}
          className={`jx-sutra-card block relative overflow-hidden rounded-xl border ${t.border} bg-gradient-to-br ${t.accent} px-5 py-5 animate-jx-fade`}
          style={{ animationDelay: `${idx * 80}ms`, animationFillMode: "backwards" }}
        >
          {/* 图标 */}
          <span className={`text-2xl ${t.label} block mb-2`}>{t.icon}</span>
          {/* 标题 */}
          <span className="block text-lg font-medium tracking-wide">{t.title}</span>
          <p className="mt-1 text-sm text-[var(--muted)]">{t.desc}</p>
          {/* 箭头 */}
          <span className="absolute bottom-4 right-4 text-lg text-[var(--jx-muted-label)] opacity-40 group-hover:opacity-100 transition-opacity">
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
