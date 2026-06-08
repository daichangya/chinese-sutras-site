/**
 * 知识图谱三栏探索器
 * @author 代长亚
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { KgControls } from "@/components/kg/kg-controls";
import { KgCuratedChips } from "@/components/kg/kg-curated-chips";
import { KgEntityCard, type KgEntityDetail } from "@/components/kg/kg-entity-card";
import { mergeGraphData } from "@/lib/kg/merge-graph";

const KgForceGraph = dynamic(
  () => import("@/components/kg/kg-force-graph").then((m) => m.KgForceGraph),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[320px] items-center justify-center text-sm text-[var(--muted)]">
        加载图谱…
      </div>
    ),
  },
);
import { KgLegend } from "@/components/kg/kg-legend";
import { KgMentionsPanel } from "@/components/kg/kg-mentions-panel";
import { KgSearchPanel, type KgSearchResult } from "@/components/kg/kg-search-panel";
import { KgStatsBar, type KgStats } from "@/components/kg/kg-stats-bar";
import { KgTimeline, type KgTimelineEntity } from "@/components/kg/kg-timeline";
import { KgToolbar } from "@/components/kg/kg-toolbar";
import { entityIdToSlug } from "@/lib/kg/slug";
import type { KgGraphEdge, KgGraphNode } from "@/lib/kg/types";

type MobileTab = "search" | "graph" | "detail";

const DEFAULT_PREDS = ["translated", "teacher_of", "composed_in"];
const SCHOOL_GRAPH_PREDS = ["member_of_school", "associated_with"];
const CONCEPT_GRAPH_PREDS = ["associated_with"];

function graphPredicatesForEntityType(entityType: string, current: string[]): string[] {
  if (entityType === "school") {
    return [...new Set([...current, ...SCHOOL_GRAPH_PREDS])];
  }
  if (entityType === "concept") {
    return [...new Set([...current, ...CONCEPT_GRAPH_PREDS])];
  }
  return current;
}

export function KgExplorer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialLoadDone = useRef(false);

  const [query, setQuery] = useState(() => searchParams.get("q") || "玄奘");
  const [entityType, setEntityType] = useState(() => searchParams.get("type") || "");
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [depth, setDepth] = useState(() => parseInt(searchParams.get("depth") ?? "2", 10) || 2);
  const [predicates, setPredicates] = useState<string[]>(() => {
    const rels = searchParams.get("rels");
    return rels ? rels.split(",").filter(Boolean) : DEFAULT_PREDS;
  });

  const [searchResults, setSearchResults] = useState<KgSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchRelaxedType, setSearchRelaxedType] = useState(false);
  const [graphNodes, setGraphNodes] = useState<KgGraphNode[]>([]);
  const [graphEdges, setGraphEdges] = useState<KgGraphEdge[]>([]);
  const [graphTruncated, setGraphTruncated] = useState(false);
  const [graphLoading, setGraphLoading] = useState(false);
  const [entity, setEntity] = useState<KgEntityDetail | null>(null);
  const [entityLoading, setEntityLoading] = useState(false);
  const [stats, setStats] = useState<KgStats | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("search");
  const [showTimeline, setShowTimeline] = useState(false);
  const [timelineEntities, setTimelineEntities] = useState<KgTimelineEntity[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [truncationDismissed, setTruncationDismissed] = useState(false);

  const syncUrl = useCallback(
    (opts: {
      q?: string;
      slug?: string | null;
      depth?: number;
      rels?: string[];
      type?: string;
      entityId?: string | null;
    }) => {
      const params = new URLSearchParams();
      const q = opts.q ?? query;
      if (q) params.set("q", q);
      const typeVal = opts.type !== undefined ? opts.type : entityType;
      if (typeVal) params.set("type", typeVal);
      const idForSlug = opts.entityId !== undefined ? opts.entityId : selectedEntityId;
      const slug =
        opts.slug !== undefined
          ? opts.slug
          : idForSlug
            ? entityIdToSlug(idForSlug)
            : null;
      if (slug) params.set("slug", slug);
      params.set("depth", String(opts.depth ?? depth));
      const rels = opts.rels ?? predicates;
      if (rels.length) params.set("rels", rels.join(","));
      router.replace(`/kg?${params.toString()}`, { scroll: false });
    },
    [query, entityType, selectedEntityId, depth, predicates, router],
  );

  const runSearchWith = useCallback(
    async (opts: { q: string; type?: string }) => {
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({ q: opts.q, limit: "20" });
        if (opts.type) params.set("type", opts.type);
        const res = await fetch(`/api/kg/search?${params}`);
        const data = (await res.json()) as {
          results: KgSearchResult[];
          relaxedType?: boolean;
        };
        setSearchResults(data.results ?? []);
        setSearchRelaxedType(!!data.relaxedType);
        return data.results ?? [];
      } catch {
        setSearchResults([]);
        setSearchRelaxedType(false);
        return [];
      } finally {
        setSearchLoading(false);
      }
    },
    [],
  );

  const runSearch = useCallback(async () => {
    return runSearchWith({ q: query, type: entityType || undefined });
  }, [query, entityType, runSearchWith]);

  const loadGraph = useCallback(
    async (centerSlugOrId: string, typeHint?: string, relsOverride?: string[]) => {
      setGraphLoading(true);
      setTruncationDismissed(false);
      try {
        const params = new URLSearchParams({
          centerId: centerSlugOrId,
          depth: String(depth),
          limit: "80",
        });
        if (typeHint) params.set("entityType", typeHint);
        const rels = relsOverride ?? predicates;
        if (rels.length) params.set("rels", rels.join(","));
        const res = await fetch(`/api/kg/graph?${params}`);
        const data = (await res.json()) as {
          nodes: KgGraphNode[];
          edges: KgGraphEdge[];
          resolvedCenterId?: string | null;
          truncated?: boolean;
        };
        setGraphNodes(data.nodes ?? []);
        setGraphEdges(data.edges ?? []);
        setGraphTruncated(!!data.truncated);
        if (data.resolvedCenterId) setSelectedEntityId(data.resolvedCenterId);
      } catch {
        setGraphNodes([]);
        setGraphEdges([]);
        setGraphTruncated(false);
      } finally {
        setGraphLoading(false);
      }
    },
    [depth, predicates],
  );

  const loadEntity = useCallback(async (idOrSlug: string, typeHint?: string) => {
    setEntityLoading(true);
    try {
      const params = new URLSearchParams();
      if (idOrSlug.startsWith("kg:")) params.set("id", idOrSlug);
      else {
        params.set("slug", idOrSlug);
        if (typeHint) params.set("entityType", typeHint);
      }
      const res = await fetch(`/api/kg/entity?${params}`);
      if (!res.ok) {
        setEntity(null);
        return null;
      }
      const data = (await res.json()) as { entity: KgEntityDetail };
      setEntity(data.entity ?? null);
      if (data.entity?.id) setSelectedEntityId(data.entity.id);
      return data.entity ?? null;
    } catch {
      setEntity(null);
      return null;
    } finally {
      setEntityLoading(false);
    }
  }, []);

  const selectEntity = useCallback(
    (r: KgSearchResult) => {
      setSelectedEntityId(r.id);
      setQuery(r.name_zh);
      const nextPreds = graphPredicatesForEntityType(r.entity_type, predicates);
      if (nextPreds.length !== predicates.length) {
        setPredicates(nextPreds);
        syncUrl({ q: r.name_zh, slug: r.slug, type: r.entity_type, entityId: r.id, rels: nextPreds });
      } else {
        syncUrl({ q: r.name_zh, slug: r.slug, type: r.entity_type, entityId: r.id });
      }
      void loadGraph(r.id, r.entity_type, nextPreds);
      void loadEntity(r.id);
      setMobileTab("graph");
    },
    [loadGraph, loadEntity, syncUrl, predicates],
  );

  const selectBySlug = useCallback(
    (slug: string, id: string) => {
      setSelectedEntityId(id);
      syncUrl({ slug, entityId: id });
      void loadGraph(slug);
      void loadEntity(slug);
      setMobileTab("graph");
    },
    [loadGraph, loadEntity, syncUrl],
  );

  const handleNodeClick = useCallback(
    (node: KgGraphNode) => {
      setSelectedEntityId(node.id);
      syncUrl({ slug: entityIdToSlug(node.id), entityId: node.id });
      void loadEntity(node.id);
      setMobileTab("detail");
    },
    [loadEntity, syncUrl],
  );

  const handleNodeExpand = useCallback(
    async (node: KgGraphNode) => {
      const params = new URLSearchParams({
        centerId: node.id,
        depth: "1",
        limit: "40",
      });
      if (predicates.length) params.set("rels", predicates.join(","));
      const res = await fetch(`/api/kg/graph?${params}`);
      const data = (await res.json()) as { nodes: KgGraphNode[]; edges: KgGraphEdge[] };
      const merged = mergeGraphData(
        { nodes: graphNodes, edges: graphEdges },
        { nodes: data.nodes ?? [], edges: data.edges ?? [] },
      );
      setGraphNodes(merged.nodes);
      setGraphEdges(merged.edges);
    },
    [graphNodes, graphEdges, predicates],
  );

  const handleTimelineClick = useCallback(
    (e: KgTimelineEntity) => {
      selectBySlug(e.slug, e.id);
      setQuery(e.name_zh);
    },
    [selectBySlug],
  );

  useEffect(() => {
    void fetch("/api/kg/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    if (!stats?.entityCounts || !entityType) return;
    if ((stats.entityCounts[entityType] ?? 0) > 0) return;
    setEntityType("");
    syncUrl({ type: "" });
  }, [stats?.entityCounts, entityType, syncUrl]);

  useEffect(() => {
    if (!showTimeline) return;
    setTimelineLoading(true);
    void fetch("/api/kg/timeline")
      .then((r) => r.json())
      .then((data: { entities: KgTimelineEntity[] }) => setTimelineEntities(data.entities ?? []))
      .catch(() => setTimelineEntities([]))
      .finally(() => setTimelineLoading(false));
  }, [showTimeline]);

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const slug = searchParams.get("slug");
    const type = searchParams.get("type") || undefined;
    if (slug) {
      void loadGraph(slug, type);
      void loadEntity(slug, type);
      void runSearch();
      return;
    }

    void runSearch().then((results) => {
      if (results.length > 0) selectEntity(results[0]!);
    });
  }, [searchParams, loadGraph, loadEntity, runSearch, selectEntity]);

  useEffect(() => {
    if (!selectedEntityId) return;
    void loadGraph(selectedEntityId);
  }, [depth, predicates]); // eslint-disable-line react-hooks/exhaustive-deps

  const pickCurated = (label: string, type: string) => {
    const typeFilter =
      stats?.entityCounts && (stats.entityCounts[type] ?? 0) > 0 ? type : undefined;
    setQuery(label);
    setEntityType(typeFilter ?? "");
    syncUrl({ q: label, type: typeFilter ?? "" });
    void runSearchWith({ q: label, type: typeFilter }).then((results) => {
      if (results.length > 0) selectEntity(results[0]!);
    });
  };

  const handleSearch = () => {
    void runSearch();
  };

  const entityHasRelations = graphEdges.length > 0;
  const showMentionsFallback =
    !!selectedEntityId &&
    !graphLoading &&
    !entityHasRelations &&
    !!entity &&
    graphNodes.length <= 1;

  const emptyDataNotice =
    stats?.totalEntities === 0 ? (
      <p className="mb-3 rounded-lg border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] px-4 py-3 text-sm text-[var(--muted)]">
        暂无图谱数据，请联系管理员导入知识图谱。您仍可使用搜索框查询。
      </p>
    ) : null;

  return (
    <div>
      <KgStatsBar stats={stats} />

      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowTimeline((v) => !v)}
          className={`rounded-full border px-3 py-1 text-xs ${
            showTimeline
              ? "border-[var(--jx-accent-cinnabar)] bg-[var(--jx-accent-cinnabar)]/10"
              : "border-[var(--jx-border)]"
          }`}
          data-testid="kg-timeline-toggle"
        >
          {showTimeline ? "隐藏时间轴" : "显示时间轴"}
        </button>
      </div>

      {showTimeline && (
        <KgTimeline
          entities={timelineEntities}
          loading={timelineLoading}
          selectedEntityId={selectedEntityId}
          onEntityClick={handleTimelineClick}
        />
      )}

      <div className="sticky top-0 z-10 bg-[var(--background)] pb-2 lg:static lg:z-auto lg:pb-0">
        <KgToolbar
          query={query}
          onQueryChange={setQuery}
          entityType={entityType}
          entityCounts={stats?.entityCounts}
          onEntityTypeChange={(t) => {
            setEntityType(t);
            syncUrl({ type: t });
          }}
          depth={depth}
          onDepthChange={(d) => {
            setDepth(d);
            syncUrl({ depth: d });
          }}
          onSearch={handleSearch}
          loading={searchLoading}
        />
      </div>

      <KgCuratedChips entityCounts={stats?.entityCounts} onPick={pickCurated} />
      <KgControls
        predicates={predicates}
        onPredicatesChange={(p) => {
          setPredicates(p);
          syncUrl({ rels: p });
        }}
      />

      <div className="mb-3 flex gap-2 lg:hidden">
        {(["search", "graph", "detail"] as MobileTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setMobileTab(tab)}
            className={`rounded-full px-3 py-1 text-xs ${
              mobileTab === tab
                ? "bg-[var(--jx-accent-cinnabar)] text-white"
                : "border border-[var(--jx-border)]"
            }`}
          >
            {tab === "search" ? "结果" : tab === "graph" ? "图谱" : "详情"}
          </button>
        ))}
      </div>

      {emptyDataNotice}

      <div
        className="grid min-h-[520px] gap-0 overflow-hidden rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] lg:grid-cols-[240px_minmax(0,1fr)_260px]"
        data-testid="kg-explorer-layout"
      >
        <aside
          className={`lg:bg-[var(--jx-sidebar-bg)] ${mobileTab !== "search" ? "hidden lg:block" : ""}`}
        >
          <KgSearchPanel
            results={searchResults}
            loading={searchLoading}
            query={query}
            relaxedType={searchRelaxedType}
            selectedEntityId={selectedEntityId}
            onSelect={selectEntity}
          />
        </aside>

        <main className={`relative min-h-[480px] ${mobileTab !== "graph" ? "hidden lg:block" : ""}`}>
          {graphLoading ? (
            <p className="flex h-full items-center justify-center text-sm text-[var(--muted)]">加载图谱…</p>
          ) : showMentionsFallback && entity ? (
            <KgMentionsPanel
              entitySlug={entity.slug}
              entityName={entity.name_zh}
              onEntityClick={selectBySlug}
            />
          ) : graphNodes.length > 0 ? (
            <div className="relative h-full min-h-[480px]">
              {graphTruncated && !truncationDismissed && (
                <div
                  className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between gap-2 border-b border-amber-200/60 bg-amber-50/95 px-3 py-2 text-xs text-amber-900 dark:border-amber-800/40 dark:bg-amber-950/90 dark:text-amber-100"
                  data-testid="kg-truncated-bar"
                >
                  <span>
                    图谱节点超出（{graphNodes.length} 节点 / {graphEdges.length}{" "}
                    边），可减小深度或过滤关系类型
                  </span>
                  <button
                    type="button"
                    onClick={() => setTruncationDismissed(true)}
                    className="shrink-0 opacity-70 hover:opacity-100"
                    aria-label="关闭提示"
                  >
                    ✕
                  </button>
                </div>
              )}
              <KgForceGraph
                nodes={graphNodes}
                edges={graphEdges}
                selectedId={selectedEntityId}
                onNodeClick={handleNodeClick}
                onNodeExpand={handleNodeExpand}
              />
              <KgLegend nodes={graphNodes} edges={graphEdges} />
            </div>
          ) : (
            <div
              className="flex h-[480px] items-center justify-center text-sm text-[var(--muted)]"
              data-testid="kg-graph-empty"
            >
              选择实体查看知识图谱
            </div>
          )}
        </main>

        <aside
          className={`lg:bg-[var(--jx-paper-deep)] ${mobileTab !== "detail" ? "hidden lg:block" : ""}`}
        >
          <p className="jx-section-label border-b border-[var(--jx-border)]/40 px-4 py-3">实体说明</p>
          <KgEntityCard entity={entity} loading={entityLoading} />
        </aside>
      </div>
    </div>
  );
}
