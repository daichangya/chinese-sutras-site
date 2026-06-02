/**
 * 首页热门经目网格（无尽藏式经目卡 — 卡片化 + 部类色标）
 * @author jingxin
 */
import Link from "next/link";

const SLUG_HINT: Record<string, string> = {
  xinjing: "般若",
  jingangjing: "般若",
  dizangjing: "菩萨",
  amituojing: "净土",
  fahuajing: "法华",
  liangyanjing: "密教",
  liuzutanjing: "禅宗",
  weimojiejing: "菩萨",
  zhonglun: "中观",
  wuliangshoujing: "净土",
  guanwuliangshoujing: "净土",
  huayanjing: "华严",
};

const DEPT_COLOR: Record<string, string> = {
  般若: "bg-amber-500",
  菩萨: "bg-emerald-500",
  净土: "bg-sky-500",
  法华: "bg-violet-500",
  密教: "bg-rose-500",
  禅宗: "bg-teal-500",
  中观: "bg-indigo-500",
  华严: "bg-orange-500",
};

export function PopularSutraGrid({
  sutras,
}: {
  sutras: Array<{
    slug: string;
    title: string;
    translator: string | null;
    charCount?: number;
  }>;
}) {
  return (
    <ul
      data-testid="popular-sutra-grid"
      className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
    >
      {sutras.map((s, idx) => {
        const dept = SLUG_HINT[s.slug] ?? "佛经";
        const dot = DEPT_COLOR[dept] ?? "bg-stone-400";
        return (
          <li key={s.slug} className="animate-jx-fade" style={{ animationDelay: `${idx * 50}ms`, animationFillMode: "backwards" }}>
            <Link
              href={`/sutra/${s.slug}`}
              className="jx-sutra-card group flex flex-col px-5 py-4.5"
            >
              {/* 部类色标 */}
              <span className="flex items-center gap-2 text-xs text-[var(--jx-muted-label)]">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${dot}`} />
                {dept}
              </span>
              {/* 经名 */}
              <span className="mt-2 text-base font-medium tracking-wide group-hover:text-amber-900 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                {s.title}
              </span>
              {/* 元信息 */}
              <span className="mt-1.5 text-xs text-[var(--muted)] truncate">
                {s.translator ? `${s.translator} · ` : ""}
                {s.charCount ? `${s.charCount.toLocaleString()} 字` : "阅读"}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
