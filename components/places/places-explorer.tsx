/**
 * 佛教地理探索器（FoJin KGMapPage 对齐）
 * @author 代长亚
 */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { KgGeoEntity } from "@/lib/kg/geo";
import {
  formatGeoAddress,
  isChineseGeoName,
  searchGeoEntities,
} from "@/lib/places/geo-search";

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

type LineageArc = {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  fromName: string;
  toName: string;
};

const GEO_FETCH_LIMIT = 5000;
const GEO_FETCH_TIMEOUT_MS = 120_000;

export function PlacesExplorer({ initialFocus }: { initialFocus?: string }) {
  const [entities, setEntities] = useState<KgGeoEntity[]>([]);
  const [arcs, setArcs] = useState<LineageArc[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityTypes, setEntityTypes] = useState<string[]>([
    "monastery",
    "place",
    "person",
  ]);
  const [showArcs, setShowArcs] = useState(false);
  const [chineseOnly, setChineseOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selected, setSelected] = useState<KgGeoEntity | null>(null);
  const [focusEntity, setFocusEntity] = useState<KgGeoEntity | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), GEO_FETCH_TIMEOUT_MS);
    setLoading(true);
    fetch(`/api/kg/geo?limit=${GEO_FETCH_LIMIT}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((d: { entities: KgGeoEntity[] }) => setEntities(d.entities ?? []))
      .catch(() => setEntities([]))
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!showArcs) {
      setArcs([]);
      return;
    }
    fetch("/api/kg/lineage-arcs?limit=8000")
      .then((r) => r.json())
      .then((d: { arcs: LineageArc[] }) => setArcs(d.arcs ?? []))
      .catch(() => setArcs([]));
  }, [showArcs]);

  useEffect(() => {
    if (!initialFocus || entities.length === 0) return;
    const hit = entities.find((e) => e.slug === initialFocus || e.id === initialFocus);
    if (hit) {
      setFocusEntity(hit);
      setSelected(hit);
    }
  }, [initialFocus, entities]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pool = useMemo(() => {
    let list = entities;
    if (chineseOnly) {
      list = list.filter((e) => isChineseGeoName(e.name_zh));
    }
    return list;
  }, [entities, chineseOnly]);

  const filteredCount = useMemo(
    () => pool.filter((e) => entityTypes.includes(e.entity_type)).length,
    [pool, entityTypes],
  );

  const searchHits = useMemo(
    () => searchGeoEntities(pool, searchQuery, 30),
    [pool, searchQuery],
  );

  const toggleType = (t: string) => {
    setEntityTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };

  const handleSearchPick = (e: KgGeoEntity) => {
    setFocusEntity(e);
    setSelected(e);
    setSearchQuery(e.name_zh);
    setSearchOpen(false);
  };

  if (loading) {
    return <p className="text-sm text-[var(--muted)]">加载地理数据…</p>;
  }

  if (entities.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--jx-border)] p-10 text-center text-sm text-[var(--muted)]">
        暂无地理坐标数据。请先运行{" "}
        <code className="text-xs">npm run kg:import:dila:place && npm run kg:import:sqlite</code>
        ；人物坐标可运行 <code className="text-xs">npm run kg:enrich:person-geo</code>。
      </div>
    );
  }

  return (
    <div data-testid="places-map-layout">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
        <span data-testid="places-stats-badge">
          {filteredCount.toLocaleString()} 个标注
          {chineseOnly && " · 纯中文"}
        </span>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)]">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--jx-border)] px-3 py-2.5 text-xs">
          <span className="text-[var(--muted)]">实体类型:</span>
          {TYPE_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex cursor-pointer items-center gap-1">
              <input
                type="checkbox"
                checked={entityTypes.includes(opt.value)}
                onChange={() => toggleType(opt.value)}
              />
              {opt.label}
            </label>
          ))}
          <label className="flex cursor-pointer items-center gap-1">
            <input
              type="checkbox"
              checked={showArcs}
              onChange={(e) => setShowArcs(e.target.checked)}
            />
            师承传线
          </label>
          <label className="flex cursor-pointer items-center gap-1">
            <input
              type="checkbox"
              checked={chineseOnly}
              onChange={(e) => setChineseOnly(e.target.checked)}
            />
            纯中文
          </label>

          <div ref={searchRef} className="relative ml-auto min-w-[200px] flex-1 sm:max-w-xs">
            <input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="搜索寺院、地点、人物…"
              className="jx-input w-full text-sm"
              data-testid="places-search-input"
            />
            {searchOpen && searchQuery.trim() && searchHits.length > 0 && (
              <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] shadow-lg">
                {searchHits.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-[var(--jx-paper-deep)]"
                      onClick={() => handleSearchPick(e)}
                    >
                      <span className="font-medium text-[var(--jx-accent-cinnabar)]">
                        {e.name_zh}
                      </span>
                      <span className="ml-2 text-xs text-[var(--muted)]">
                        {formatGeoAddress(e) || e.name_en || ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="h-[min(calc(100vh-220px),720px)] min-h-[480px]">
          <DeckGLMapInner
            entities={pool}
            arcs={arcs}
            showArcs={showArcs}
            entityTypes={entityTypes}
            focusEntity={focusEntity}
            selectedEntity={selected}
            onSelect={setSelected}
            onClosePopup={() => setSelected(null)}
          />
        </div>
      </div>
    </div>
  );
}
