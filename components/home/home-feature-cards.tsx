/**
 * 首页能力入口卡片（对标 FoJin 六宫格）
 * @author 代长亚
 */
import Link from "next/link";
import {
  BookOpen,
  Bot,
  GitBranch,
  Layers,
  Map,
  ScrollText,
} from "lucide-react";

const FEATURES = [
  {
    href: "/chat",
    icon: Bot,
    title: "AI 问经",
    desc: "基于经文的智能问答",
  },
  {
    href: "/dictionary",
    icon: ScrollText,
    title: "佛教辞典",
    desc: "划选查词，多源释义",
  },
  {
    href: "/canon",
    icon: BookOpen,
    title: "经藏浏览",
    desc: "按部类探索汉传经典",
  },
  {
    href: "/search",
    icon: Layers,
    title: "全文检索",
    desc: "经目与段落统一搜索",
  },
  {
    href: "/kg",
    icon: GitBranch,
    title: "知识图谱",
    desc: "人物、经典与关系",
  },
  {
    href: "/places",
    icon: Map,
    title: "佛教地理",
    desc: "圣地与寺院地图",
  },
] as const;

export function HomeFeatureCards({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "mt-8 w-full" : "mx-auto max-w-4xl px-4 py-10 md:py-14"}>
      {!compact && (
        <div className="mb-6 flex items-center gap-3">
          <p className="jx-section-label">探索静心</p>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--jx-border)]/40 to-transparent" />
        </div>
      )}
      <div
        data-testid="home-feature-grid"
        className={
          compact
            ? "flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-6 sm:overflow-visible sm:pb-0 sm:snap-none"
            : "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3"
        }
      >
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`jx-sutra-card group flex cursor-pointer gap-2 px-3 py-3 transition-transform hover:-translate-y-0.5 jx-ui-shell sm:flex-col sm:gap-2 sm:px-4 sm:py-4 ${
              compact
                ? "min-w-[8.25rem] shrink-0 snap-start sm:min-h-[5rem] sm:min-w-0 sm:shrink"
                : "min-h-[5.5rem] flex-col px-4 py-4"
            }`}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--jx-accent-cinnabar)]/8 text-[var(--jx-accent-cinnabar)] sm:h-9 sm:w-9">
              <f.icon className="size-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-medium text-[var(--foreground)] group-hover:text-[var(--jx-accent-cinnabar)]">
                {f.title}
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-[var(--muted)] line-clamp-2 sm:text-[11px]">
                {f.desc}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-[var(--jx-muted-label)] jx-ui-shell">
        无需注册即可搜索、阅读与体验 AI 辅助理解
      </p>
    </section>
  );
}
