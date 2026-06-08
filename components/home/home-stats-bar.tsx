/**
 * 首页语料规模统计条
 * @author 代长亚
 */
import type { CorpusStats } from "@/lib/stats/corpus-stats";

export function HomeStatsBar({ stats }: { stats: CorpusStats }) {
  if (stats.sutraCount === 0) return null;

  const items = [
    { value: stats.sutraCount, label: "部经" },
    { value: stats.paragraphCount, label: "段经文" },
    ...(stats.dictEntryCount > 0
      ? [{ value: stats.dictEntryCount, label: "辞典词条" }]
      : []),
    ...(stats.kgEntityCount > 0
      ? [{ value: stats.kgEntityCount, label: "知识实体" }]
      : []),
  ];

  return (
    <div
      data-testid="home-stats-bar"
      className="mx-auto mt-6 flex w-full max-w-4xl flex-wrap items-center justify-center gap-x-10 gap-y-3 text-center jx-ui-shell"
    >
      {items.map((item) => (
        <div key={item.label} className="min-w-[4.5rem]">
          <p className="jx-stat-number text-2xl font-light">
            {item.value.toLocaleString("zh-CN")}
          </p>
          <p className="mt-0.5 text-xs tracking-wide text-[var(--jx-muted-label)]">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}
