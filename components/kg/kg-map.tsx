/**
 * Deck.GL 佛教地理地图
 * @author jingxin
 */
"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { labelType, TYPE_COLORS } from "@/lib/kg/labels";
import { personPath } from "@/lib/kg/slug";

type GeoEntity = {
  id: string;
  slug: string;
  name_zh: string;
  entity_type: string;
  lat: number;
  lng: number;
};

type LineageArc = {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
};

const DeckGLMapInner = dynamic(() => import("@/components/kg/kg-map-deck"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[480px] items-center justify-center text-sm text-[var(--muted)]">
      加载地图…
    </div>
  ),
});

const TYPE_OPTIONS = [
  { value: "monastery", label: "寺院" },
  { value: "place", label: "地点" },
  { value: "person", label: "人物" },
  { value: "school", label: "宗派" },
] as const;

export function KgMap({ initialFocus }: { initialFocus?: string }) {
  const [entities, setEntities] = useState<GeoEntity[]>([]);
  const [arcs, setArcs] = useState<LineageArc[]>([]);
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<string[]>(["monastery", "place", "person"]);
  const [showArcs, setShowArcs] = useState(false);
  const [selected, setSelected] = useState<GeoEntity | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("/api/kg/geo?limit=500")
      .then((r) => r.json())
      .then((d: { entities: GeoEntity[] }) => setEntities(d.entities ?? []))
      .catch(() => setEntities([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!showArcs) return;
    fetch("/api/kg/lineage-arcs?limit=200")
      .then((r) => r.json())
      .then((d: { arcs: LineageArc[] }) => setArcs(d.arcs ?? []))
      .catch(() => setArcs([]));
  }, [showArcs]);

  useEffect(() => {
    if (!initialFocus || entities.length === 0) return;
    const hit = entities.find((e) => e.slug === initialFocus || e.id === initialFocus);
    if (hit) setSelected(hit);
  }, [initialFocus, entities]);

  const filtered = useMemo(() => {
    let list = entities.filter((e) => types.includes(e.entity_type));
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((e) => e.name_zh.toLowerCase().includes(q));
    }
    return list;
  }, [entities, types, query]);

  const toggleType = (t: string) => {
    setTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">加载地理数据…</p>;
  }

  if (entities.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--jx-border)] p-10 text-center text-sm text-[var(--muted)]">
        暂无地理坐标数据。请联系管理员导入地名与坐标。
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]" data-testid="places-map-layout">
      <div className="min-h-[480px] overflow-hidden rounded-xl border border-[var(--jx-border)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--jx-border)] px-3 py-2 text-xs">
          {TYPE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={types.includes(opt.value)}
                onChange={() => toggleType(opt.value)}
              />
              {opt.label}
            </label>
          ))}
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={showArcs} onChange={(e) => setShowArcs(e.target.checked)} />
            师承传线
          </label>
        </div>
        <DeckGLMapInner
          entities={filtered}
          arcs={showArcs ? arcs : []}
          onSelect={setSelected}
          selectedId={selected?.id}
        />
      </div>
      <div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="筛选地名…"
          className="jx-input mb-3 w-full text-sm"
        />
        {selected && (
          <div className="mb-3 rounded-lg border border-[var(--jx-border)] p-3 text-sm">
            <p className="font-medium">{selected.name_zh}</p>
            <p className="text-xs text-[var(--muted)]">{labelType(selected.entity_type)}</p>
            {selected.entity_type === "person" && (
              <Link href={personPath(selected.slug)} className="mt-2 inline-block text-xs text-[var(--jx-accent-cinnabar)]">
                查看人物 →
              </Link>
            )}
            <Link
              href={`/kg?slug=${encodeURIComponent(selected.slug)}`}
              className="ml-3 mt-2 inline-block text-xs text-[var(--jx-accent-cinnabar)]"
            >
              在图谱中查看 →
            </Link>
          </div>
        )}
        <ul className="max-h-[400px] space-y-2 overflow-y-auto">
          {filtered.slice(0, 80).map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setSelected(p)}
                className="jx-sutra-card w-full px-4 py-3 text-left text-sm"
              >
                <p className="font-medium">{p.name_zh}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {labelType(p.entity_type)} · {p.lat.toFixed(2)}, {p.lng.toFixed(2)}
                </p>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
