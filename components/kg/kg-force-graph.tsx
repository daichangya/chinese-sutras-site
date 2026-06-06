/**
 * D3 力导向知识图谱
 * @author jingxin
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { TYPE_COLORS, PREDICATE_COLORS } from "@/lib/kg/labels";
import type { KgGraphEdge, KgGraphNode } from "@/lib/kg/types";

type SimNode = KgGraphNode & { x?: number; y?: number; fx?: number | null; fy?: number | null };

type SimLink = {
  source: string | SimNode;
  target: string | SimNode;
  predicate: string;
  provenance?: string;
};

export function KgForceGraph({
  nodes,
  edges,
  selectedId,
  onNodeClick,
  onNodeExpand,
  height = 480,
}: {
  nodes: KgGraphNode[];
  edges: KgGraphEdge[];
  selectedId?: string | null;
  onNodeClick?: (node: KgGraphNode) => void;
  onNodeExpand?: (node: KgGraphNode) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(640);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) setWidth(Math.max(320, e.contentRect.width));
    });
    ro.observe(el);
    setWidth(Math.max(320, el.clientWidth));
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
    const simLinks: SimLink[] = edges.map((e) => ({
      source: e.source,
      target: e.target,
      predicate: e.predicate,
      provenance: e.provenance,
    }));

    const degree = new Map<string, number>();
    for (const l of simLinks) {
      const s = typeof l.source === "object" ? (l.source as SimNode).id : l.source;
      const t = typeof l.target === "object" ? (l.target as SimNode).id : l.target;
      degree.set(s, (degree.get(s) ?? 0) + 1);
      degree.set(t, (degree.get(t) ?? 0) + 1);
    }
    const maxDeg = Math.max(1, ...simNodes.map((n) => degree.get(n.id) ?? 0));
    const rScale = d3.scaleSqrt().domain([0, maxDeg]).range([8, 22]).clamp(true);
    const nodeR = (d: SimNode) => rScale(degree.get(d.id) ?? 0);

    const defs = svg.append("defs");
    const preds = [...new Set(simLinks.map((l) => l.predicate))];
    for (const pred of preds) {
      const color = PREDICATE_COLORS[pred] ?? "#bbb5a6";
      defs
        .append("marker")
        .attr("id", `arrow-${pred}`)
        .attr("viewBox", "0 0 10 6")
        .attr("refX", 10)
        .attr("refY", 3)
        .attr("markerWidth", 8)
        .attr("markerHeight", 5)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,0 L10,3 L0,6 Z")
        .attr("fill", color)
        .attr("opacity", 0.5);
    }

    const g = svg.append("g");
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 5])
      .on("zoom", (ev) => g.attr("transform", ev.transform));
    svg.call(zoom);

    const n = simNodes.length;
    const simulation = d3
      .forceSimulation(simNodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(n > 50 ? 90 : 120),
      )
      .force("charge", d3.forceManyBody().strength(n > 50 ? -220 : -320))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide<SimNode>().radius((d) => nodeR(d) + 6));

    const link = g
      .append("g")
      .selectAll("line")
      .data(simLinks)
      .join("line")
      .attr("stroke", (d) => PREDICATE_COLORS[d.predicate] ?? "#bbb5a6")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.2)
      .attr("marker-end", (d) => `url(#arrow-${d.predicate})`);

    const node = g
      .append("g")
      .selectAll("g")
      .data(simNodes)
      .join("g")
      .style("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, SimNode>()
          .on("start", (ev, d) => {
            if (!ev.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (ev, d) => {
            d.fx = ev.x;
            d.fy = ev.y;
          })
          .on("end", (ev, d) => {
            if (!ev.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as never,
      );

    node
      .append("circle")
      .attr("r", (d) => nodeR(d))
      .attr("fill", (d) => TYPE_COLORS[d.entityType] ?? "#a8a29e")
      .attr("stroke", (d) => (d.id === selectedId ? "var(--jx-accent-cinnabar)" : "transparent"))
      .attr("stroke-width", 2);

    node
      .append("text")
      .attr("dy", (d) => nodeR(d) + 12)
      .attr("text-anchor", "middle")
      .attr("class", "fill-[var(--foreground)] text-[9px]")
      .text((d) => (d.label.length > 10 ? `${d.label.slice(0, 10)}…` : d.label));

    node.on("click", (_ev, d) => onNodeClick?.(d));
    node.on("dblclick", (ev, d) => {
      ev.stopPropagation();
      onNodeExpand?.(d);
    });

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);
      node.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges, width, height, selectedId, onNodeClick, onNodeExpand]);

  if (nodes.length === 0) {
    return (
      <div
        className="flex h-[480px] items-center justify-center text-sm text-[var(--muted)]"
        data-testid="kg-graph-empty"
      >
        选择左侧实体以加载关系图
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full min-h-[480px] w-full">
      <svg ref={svgRef} width={width} height={height} className="w-full" role="img" aria-label="知识图谱力导向图" />
      <p className="absolute bottom-2 right-3 text-[10px] text-[var(--jx-muted-label)]">
        单击选中 · 双击展开
      </p>
    </div>
  );
}

export function mergeGraphData(
  base: { nodes: KgGraphNode[]; edges: KgGraphEdge[] },
  incoming: { nodes: KgGraphNode[]; edges: KgGraphEdge[] },
): { nodes: KgGraphNode[]; edges: KgGraphEdge[] } {
  const nodeMap = new Map(base.nodes.map((n) => [n.id, n]));
  for (const n of incoming.nodes) {
    if (!nodeMap.has(n.id)) nodeMap.set(n.id, n);
  }
  const edgeKeys = new Set(base.edges.map((e) => `${e.source}|${e.predicate}|${e.target}`));
  const edges = [...base.edges];
  for (const e of incoming.edges) {
    const k = `${e.source}|${e.predicate}|${e.target}`;
    if (!edgeKeys.has(k)) {
      edgeKeys.add(k);
      edges.push(e);
    }
  }
  return { nodes: [...nodeMap.values()], edges };
}
