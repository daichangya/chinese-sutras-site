/**
 * 知识图谱实体详情卡片
 * @author jingxin
 */
"use client";

import Link from "next/link";
import {
  labelPredicate,
  labelProperty,
  labelType,
  PREDICATE_ORDER,
  SOURCE_TIER_LABELS,
} from "@/lib/kg/labels";
import { personDisplayDates, personDynasty, personSchool } from "@/lib/kg/display";
import { personPath } from "@/lib/kg/slug";

export type KgEntityDetail = {
  id: string;
  slug: string;
  name_zh: string;
  name_en: string | null;
  entity_type: string;
  source_tier: string;
  properties: Record<string, unknown>;
  relations: Array<{
    predicate: string;
    predicateLabel: string;
    otherId: string;
    otherSlug: string;
    otherName: string;
    otherType: string;
    otherSutraSlug?: string | null;
  }>;
  sutras: Array<{ cbetaId: string; title: string; slug: string }>;
};

function relationLink(r: KgEntityDetail["relations"][0]) {
  if (r.otherType === "person") return personPath(r.otherSlug);
  if (r.otherType === "text") {
    if (r.otherSutraSlug) return `/sutra/${r.otherSutraSlug}`;
    return `/search?q=${encodeURIComponent(r.otherName)}`;
  }
  if (r.otherType === "place" || r.otherType === "monastery") {
    return `/places?focus=${encodeURIComponent(r.otherSlug)}`;
  }
  return `/kg?slug=${encodeURIComponent(r.otherSlug)}`;
}

export function KgEntityCard({ entity, loading }: { entity: KgEntityDetail | null; loading?: boolean }) {
  if (loading) {
    return <p className="p-4 text-sm text-[var(--muted)]">加载实体…</p>;
  }
  if (!entity) {
    return <p className="p-4 text-sm text-[var(--muted)]">点击图中节点或搜索结果查看详情</p>;
  }

  const dates = personDisplayDates(entity.properties);
  const dynasty = personDynasty(entity.properties);
  const school = personSchool(entity.properties);

  const grouped = new Map<string, KgEntityDetail["relations"]>();
  for (const r of entity.relations) {
    const list = grouped.get(r.predicate) ?? [];
    list.push(r);
    grouped.set(r.predicate, list);
  }

  const propEntries = Object.entries(entity.properties)
    .filter(([k]) => !["description", "summary", "bio", "slug"].includes(k))
    .slice(0, 6);

  return (
    <div className="space-y-4 p-4 text-sm">
      <div>
        <h3 className="text-lg font-medium text-[var(--jx-ink-classical)]">
          {entity.name_zh}
          {dates}
        </h3>
        {entity.name_en && <p className="text-xs text-[var(--muted)]">{entity.name_en}</p>}
        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
          <span className="rounded-full bg-[var(--jx-paper)] px-2 py-0.5">{labelType(entity.entity_type)}</span>
          {dynasty && (
            <span className="rounded-full bg-[var(--jx-paper)] px-2 py-0.5">{dynasty}</span>
          )}
          {school && (
            <span className="rounded-full bg-[var(--jx-paper)] px-2 py-0.5">{school}</span>
          )}
          <span className="rounded-full bg-[var(--jx-paper)] px-2 py-0.5 text-[var(--jx-muted-label)]">
            {SOURCE_TIER_LABELS[entity.source_tier] ?? entity.source_tier}
          </span>
        </div>
      </div>

      {entity.entity_type === "person" && (
        <Link
          href={personPath(entity.slug)}
          className="inline-block text-xs text-[var(--jx-accent-cinnabar)] hover:underline"
        >
          查看人物档案 →
        </Link>
      )}

      {propEntries.length > 0 && (
        <dl className="grid gap-2 text-xs">
          {propEntries.map(([k, v]) => (
            <div key={k}>
              <dt className="text-[var(--jx-muted-label)]">{labelProperty(k)}</dt>
              <dd>{String(v)}</dd>
            </div>
          ))}
        </dl>
      )}

      {entity.sutras.length > 0 && (
        <div>
          <p className="jx-section-label mb-2">相关经目</p>
          <ul className="space-y-1 text-xs">
            {entity.sutras.slice(0, 8).map((s) => (
              <li key={s.cbetaId}>
                <Link href={`/sutra/${s.slug}`} className="text-[var(--jx-accent-cinnabar)] hover:underline">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {grouped.size > 0 && (
        <div>
          <p className="jx-section-label mb-2">关系</p>
          {PREDICATE_ORDER.filter((p) => grouped.has(p)).map((pred) => (
            <div key={pred} className="mb-3">
              <p className="mb-1 text-xs font-medium text-[var(--jx-muted-label)]">
                {labelPredicate(pred)}
              </p>
              <ul className="space-y-0.5 text-xs">
                {(grouped.get(pred) ?? []).slice(0, 6).map((r) => (
                  <li key={`${r.otherId}-${pred}`}>
                    <Link href={relationLink(r)} className="hover:text-[var(--jx-accent-cinnabar)]">
                      {r.otherName}
                    </Link>
                    <span className="ml-1 text-[var(--jx-muted-label)]">({labelType(r.otherType)})</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
