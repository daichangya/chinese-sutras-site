/**
 * 知识图谱时间轴（简化版）
 * @author 代长亚
 */
"use client";

import { useMemo } from "react";
import { TYPE_COLORS } from "@/lib/kg/labels";

export type KgTimelineEntity = {
  id: string;
  slug: string;
  name_zh: string;
  entity_type: string;
  birth_year: number | null;
  death_year: number | null;
};

const BUCKET_SIZE = 100;

function formatYear(year: number): string {
  if (year < 0) return `前${Math.abs(year)}`;
  return `${year}`;
}

function bucketKey(year: number): number {
  return Math.floor(year / BUCKET_SIZE) * BUCKET_SIZE;
}

export function KgTimeline({
  entities,
  loading,
  selectedEntityId,
  onEntityClick,
}: {
  entities: KgTimelineEntity[];
  loading?: boolean;
  selectedEntityId?: string | null;
  onEntityClick: (entity: KgTimelineEntity) => void;
}) {
  const { persons, dynasties, buckets } = useMemo(() => {
    const persons = entities.filter((e) => e.entity_type === "person" && e.birth_year != null);
    const dynasties = entities.filter((e) => e.entity_type === "dynasty");
    const bucketMap = new Map<number, KgTimelineEntity[]>();
    for (const p of persons) {
      const key = bucketKey(p.birth_year!);
      const list = bucketMap.get(key) ?? [];
      list.push(p);
      bucketMap.set(key, list);
    }
    const buckets = [...bucketMap.entries()].sort((a, b) => a[0] - b[0]);
    return { persons, dynasties, buckets };
  }, [entities]);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] p-4 text-sm text-[var(--muted)]">
        加载时间轴…
      </div>
    );
  }

  if (persons.length === 0 && dynasties.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] p-4 text-sm text-[var(--muted)]">
        暂无带年代信息的实体
      </div>
    );
  }

  const minYear = Math.min(
    ...persons.map((p) => p.birth_year!),
    ...dynasties.flatMap((d) => [d.birth_year ?? 0, d.death_year ?? 0].filter(Boolean) as number[]),
  );
  const maxYear = Math.max(
    ...persons.map((p) => p.death_year ?? p.birth_year!),
    ...dynasties.flatMap((d) => [d.death_year ?? d.birth_year ?? 0]),
  );
  const span = Math.max(maxYear - minYear, 1);

  return (
    <div
      className="mb-3 overflow-x-auto rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] p-4"
      data-testid="kg-timeline"
    >
      <p className="mb-3 text-xs text-[var(--jx-muted-label)]">
        佛教人物时间轴 · 点击实体可查看详情
      </p>

      {dynasties.length > 0 && (
        <div className="relative mb-4 h-8">
          {dynasties.map((d) => {
            const start = d.birth_year ?? minYear;
            const end = d.death_year ?? maxYear;
            const left = ((start - minYear) / span) * 100;
            const width = Math.max(((end - start) / span) * 100, 2);
            return (
              <button
                key={d.id}
                type="button"
                title={`${d.name_zh} ${formatYear(start)}—${formatYear(end)}`}
                onClick={() => onEntityClick(d)}
                className="absolute top-1 h-5 rounded bg-[var(--jx-paper)] text-[9px] leading-5 hover:ring-1 hover:ring-[var(--jx-accent-cinnabar)]/40"
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  background: `${TYPE_COLORS.dynasty ?? "#b35c8a"}33`,
                }}
              >
                <span className="truncate px-1">{d.name_zh}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex min-w-[640px] items-end gap-1" style={{ height: 120 }}>
        {buckets.map(([year, list]) => {
          const maxInBucket = Math.max(...buckets.map(([, l]) => l.length));
          const h = Math.max(12, (list.length / maxInBucket) * 80);
          const isSelected = list.some((e) => e.id === selectedEntityId);
          return (
            <div key={year} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex flex-col-reverse gap-0.5" style={{ height: 80 }}>
                {list.slice(0, 5).map((e) => (
                  <button
                    key={e.id}
                    type="button"
                    title={`${e.name_zh} (${formatYear(e.birth_year!)}${e.death_year ? `—${formatYear(e.death_year)}` : ""})`}
                    onClick={() => onEntityClick(e)}
                    className={`truncate rounded px-1 text-[9px] ${
                      e.id === selectedEntityId
                        ? "bg-[var(--jx-accent-cinnabar)] text-white"
                        : "bg-[var(--jx-paper)] hover:bg-[var(--jx-accent-cinnabar)]/15"
                    }`}
                  >
                    {e.name_zh}
                  </button>
                ))}
                {list.length > 5 && (
                  <span className="text-center text-[8px] text-[var(--jx-muted-label)]">
                    +{list.length - 5}
                  </span>
                )}
              </div>
              <div
                className={`w-full rounded-t ${isSelected ? "bg-[var(--jx-accent-cinnabar)]" : "bg-[var(--jx-accent-cinnabar)]/50"}`}
                style={{ height: h }}
                title={`${formatYear(year)}—${formatYear(year + BUCKET_SIZE)} · ${list.length} 人`}
              />
              <span className="text-[8px] text-[var(--jx-muted-label)]">{formatYear(year)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
