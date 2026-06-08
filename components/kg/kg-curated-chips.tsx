/**
 * 知识图谱推荐探索入口
 * @author 代长亚
 */
"use client";

const CURATED_GROUPS: { title: string; items: { label: string; type: string }[] }[] = [
  {
    title: "高僧大德",
    items: [
      { label: "玄奘", type: "person" },
      { label: "鸠摩罗什", type: "person" },
      { label: "法显", type: "person" },
      { label: "义净", type: "person" },
      { label: "龙树", type: "person" },
      { label: "慧能", type: "person" },
    ],
  },
  {
    title: "八大宗派",
    items: [
      { label: "天台宗", type: "school" },
      { label: "华严宗", type: "school" },
      { label: "法相宗", type: "school" },
      { label: "三论宗", type: "school" },
      { label: "律宗", type: "school" },
      { label: "净土宗", type: "school" },
      { label: "禅宗", type: "school" },
      { label: "密宗", type: "school" },
    ],
  },
  {
    title: "核心概念",
    items: [
      { label: "般若", type: "concept" },
      { label: "涅槃", type: "concept" },
      { label: "菩提", type: "concept" },
      { label: "空性", type: "concept" },
    ],
  },
];

export function KgCuratedChips({
  entityCounts,
  onPick,
}: {
  entityCounts?: Record<string, number>;
  onPick: (label: string, type: string) => void;
}) {
  const visibleGroups = CURATED_GROUPS.filter((g) => {
    if (!entityCounts || Object.keys(entityCounts).length === 0) return true;
    return g.items.some((item) => (entityCounts[item.type] ?? 0) > 0);
  });

  if (visibleGroups.length === 0) return null;

  return (
    <div className="mb-4 space-y-3">
      <p className="jx-section-label">推荐探索</p>
      {visibleGroups.map((g) => {
        const visibleItems = entityCounts
          ? g.items.filter((item) => (entityCounts[item.type] ?? 0) > 0)
          : g.items;
        if (visibleItems.length === 0) return null;
        return (
          <div key={g.title}>
            <p className="mb-1.5 text-xs text-[var(--jx-muted-label)]">{g.title}</p>
            <div className="flex flex-wrap gap-2">
              {visibleItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => onPick(item.label, item.type)}
                  className="rounded-full border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] px-3 py-1 text-xs hover:border-[var(--jx-accent-cinnabar)]/40"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
