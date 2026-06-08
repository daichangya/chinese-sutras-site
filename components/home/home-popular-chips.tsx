/**
 * 首页热门检索标签
 * @author 代长亚
 */
import Link from "next/link";

const CHIPS: Array<{ label: string; href: string }> = [
  { label: "金刚经", href: "/search?q=金刚" },
  { label: "心经", href: "/sutra/xinjing" },
  { label: "净土", href: "/topic/jingtu" },
  { label: "禅宗", href: "/topic/chan" },
  { label: "空性", href: "/topic/kongxing" },
  { label: "地藏", href: "/search?q=地藏" },
  { label: "般若", href: "/search?q=般若" },
  { label: "法华", href: "/search?q=法华" },
];

export function HomePopularChips() {
  return (
    <div className="mx-auto mt-6 flex w-full max-w-4xl flex-wrap justify-center gap-2">
      {CHIPS.map((chip) => (
        <Link
          key={chip.label}
          href={chip.href}
          className="rounded-full border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] px-3.5 py-1.5 text-xs text-[var(--muted)] transition-colors hover:border-[var(--jx-accent-cinnabar)]/30 hover:text-[var(--jx-accent-cinnabar)] dark:hover:text-[var(--jx-gold)]"
        >
          {chip.label}
        </Link>
      ))}
    </div>
  );
}
