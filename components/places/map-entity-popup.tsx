/**
 * 地图实体详情 Popup（FoJin 对齐）
 * @author 代长亚
 */
"use client";

import Link from "next/link";
import { labelType } from "@/lib/kg/labels";
import type { KgGeoEntity } from "@/lib/kg/geo";
import { personPath } from "@/lib/kg/slug";
import { formatGeoAddress, formatYearRange } from "@/lib/places/geo-search";

export function MapEntityPopup({
  entity,
  onClose,
}: {
  entity: KgGeoEntity;
  onClose: () => void;
}) {
  const address = formatGeoAddress(entity);
  const yearText = formatYearRange(entity.year_start, entity.year_end);

  return (
    <div className="absolute bottom-4 left-4 z-20 max-w-sm rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)]/95 p-4 shadow-lg backdrop-blur-sm">
      <div className="flex items-start justify-between gap-2">
        <span className="rounded-full bg-[var(--jx-paper-deep)] px-2 py-0.5 text-[10px] text-[var(--muted)]">
          {labelType(entity.entity_type)}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-[var(--muted)] hover:text-[var(--jx-ink-classical)]"
          aria-label="关闭"
        >
          ×
        </button>
      </div>
      <p className="mt-2 font-serif text-base font-semibold text-[var(--jx-ink-classical)]">
        {entity.name_zh}
      </p>
      {entity.name_en && (
        <p className="mt-0.5 text-xs italic text-[var(--muted)]">{entity.name_en}</p>
      )}
      {address && (
        <p className="mt-2 flex items-center gap-1 text-xs text-[var(--muted)]">
          <span aria-hidden>📍</span>
          {address}
        </p>
      )}
      {entity.description && (
        <p className="mt-2 line-clamp-4 text-xs leading-relaxed text-[var(--jx-ink-light)]">
          {entity.description}
        </p>
      )}
      {yearText && <p className="mt-2 text-xs text-[var(--jx-gold)]">{yearText}</p>}
      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        {entity.entity_type === "person" && (
          <Link
            href={personPath(entity.slug)}
            className="text-[var(--jx-accent-cinnabar)] hover:underline"
          >
            查看人物 →
          </Link>
        )}
        <Link
          href={`/kg?slug=${encodeURIComponent(entity.slug)}`}
          className="text-[var(--jx-accent-cinnabar)] hover:underline"
        >
          在图谱中查看 →
        </Link>
      </div>
    </div>
  );
}
