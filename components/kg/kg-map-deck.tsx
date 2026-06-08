/**
 * Deck.GL 佛教地理地图（FoJin 交互对齐）
 * Map 根组件 + MapboxOverlay（deck.gl 推荐集成）
 * @author 代长亚
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ScatterplotLayer, ArcLayer } from "@deck.gl/layers";
import { MapboxOverlay } from "@deck.gl/mapbox";
import type { MapboxOverlayProps } from "@deck.gl/mapbox";
import type { PickingInfo } from "@deck.gl/core";
import { Map, useControl, type MapRef } from "react-map-gl/maplibre";
import type { ExpressionSpecification } from "@maplibre/maplibre-gl-style-spec";
import type { ErrorEvent, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_TYPE_COLORS, type KgGeoEntity } from "@/lib/kg/geo";
import { labelType } from "@/lib/kg/labels";
import { MapEntityPopup } from "@/components/places/map-entity-popup";

type LineageArc = {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  fromName: string;
  toName: string;
};

type BasemapTier = "maptiler" | "carto" | "osm";

const CARTO_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";

const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster", source: "osm" }],
};

const INITIAL_VIEW = {
  longitude: 115,
  latitude: 35,
  zoom: 4.2,
  pitch: 0,
  bearing: 0,
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

const TW_LABEL_EXPRESSION: ExpressionSpecification = [
  "case",
  ["==", ["get", "iso_a2"], "TW"],
  "台灣省",
  [
    "coalesce",
    ["get", "name:zh-Hans"],
    ["get", "name:zh"],
    ["get", "name:zh-Hant"],
    ["get", "name:en"],
    ["get", "name"],
  ],
];

function patchMapTilerZhLabels(style: StyleSpecification): StyleSpecification {
  if (!style.layers) return style;
  return {
    ...style,
    layers: style.layers.map((layer) => {
      if (layer.type !== "symbol" || !layer.layout || !("text-field" in layer.layout)) {
        return layer;
      }
      return {
        ...layer,
        layout: {
          ...layer.layout,
          "text-field": TW_LABEL_EXPRESSION,
        },
      };
    }),
  };
}

function useBasemapStyle() {
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY;
  const [tier, setTier] = useState<BasemapTier>(key ? "maptiler" : "carto");
  const [maptilerStyle, setMaptilerStyle] = useState<StyleSpecification | null>(null);

  useEffect(() => {
    if (!key || tier !== "maptiler") return;
    let cancelled = false;
    const url = `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}&language=zh`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`MapTiler ${r.status}`);
        return r.json();
      })
      .then((style: StyleSpecification) => {
        if (cancelled) return;
        setMaptilerStyle(patchMapTilerZhLabels(style));
      })
      .catch(() => {
        if (!cancelled) setTier("carto");
      });
    return () => {
      cancelled = true;
    };
  }, [key, tier]);

  const mapStyle = useMemo((): StyleSpecification | string => {
    if (tier === "maptiler" && maptilerStyle) return maptilerStyle;
    if (tier === "osm") return OSM_RASTER_STYLE;
    return CARTO_STYLE;
  }, [tier, maptilerStyle]);

  const onMapError = useCallback((evt: ErrorEvent) => {
    console.warn("[places-map] basemap error, falling back:", evt.error?.message ?? evt);
    setTier((current) => {
      if (current === "maptiler") return "carto";
      if (current === "carto") return "osm";
      return current;
    });
  }, []);

  return { mapStyle, onMapError, tier };
}

function DeckOverlay(props: MapboxOverlayProps) {
  const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
  overlay.setProps(props);
  return null;
}

export default function KgMapDeck({
  entities,
  arcs,
  showArcs,
  entityTypes,
  focusEntity,
  selectedEntity,
  onSelect,
  onClosePopup,
}: {
  entities: KgGeoEntity[];
  arcs: LineageArc[];
  showArcs: boolean;
  entityTypes: string[];
  focusEntity: KgGeoEntity | null;
  selectedEntity: KgGeoEntity | null;
  onSelect: (e: KgGeoEntity) => void;
  onClosePopup: () => void;
}) {
  const mapRef = useRef<MapRef>(null);
  const { mapStyle, onMapError } = useBasemapStyle();
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    entity: KgGeoEntity;
  } | null>(null);
  const [pulseScale, setPulseScale] = useState(1);

  useEffect(() => {
    if (!focusEntity) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    const fly = () => {
      map.flyTo({
        center: [focusEntity.lng, focusEntity.lat],
        zoom: Math.max(map.getZoom(), 9),
        duration: 1200,
      });
    };

    if (map.isStyleLoaded()) fly();
    else map.once("load", fly);
  }, [focusEntity]);

  useEffect(() => {
    if (!focusEntity) return;
    let frame: number;
    const start = performance.now();
    const animate = () => {
      const t = ((performance.now() - start) % 1200) / 1200;
      setPulseScale(1 + 0.5 * Math.sin(t * Math.PI * 2));
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [focusEntity]);

  const filtered = useMemo(
    () => entities.filter((e) => entityTypes.includes(e.entity_type)),
    [entities, entityTypes],
  );

  const handleHover = useCallback((info: PickingInfo) => {
    if (info.object && info.x != null && info.y != null) {
      setTooltip({ x: info.x, y: info.y, entity: info.object as KgGeoEntity });
    } else {
      setTooltip(null);
    }
  }, []);

  const handleClick = useCallback(
    (info: PickingInfo) => {
      if (info.object) onSelect(info.object as KgGeoEntity);
    },
    [onSelect],
  );

  const layers = useMemo(() => {
    const result = [];
    const byType = (t: string) => filtered.filter((e) => e.entity_type === t);
    const order = ["monastery", "school", "place", "person"] as const;
    for (const t of order) {
      const data = byType(t);
      if (!data.length) continue;
      result.push(
        new ScatterplotLayer<KgGeoEntity>({
          id: `entities-${t}`,
          data,
          getPosition: (d) => [d.lng, d.lat],
          getFillColor: (d) => {
            const [r, g, b] = hexToRgb(MAP_TYPE_COLORS[d.entity_type] ?? "#888888");
            return [r, g, b, 200];
          },
          getLineColor: [255, 255, 255, 220],
          lineWidthMinPixels: 0.5,
          stroked: true,
          getRadius: (d) => (d.id === selectedEntity?.id ? 4000 : 2500),
          radiusMinPixels: 3,
          radiusMaxPixels: 12,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 215, 0, 220],
        }),
      );
    }

    if (focusEntity) {
      result.push(
        new ScatterplotLayer<KgGeoEntity>({
          id: "highlight-pulse",
          data: [focusEntity],
          getPosition: (d) => [d.lng, d.lat],
          getFillColor: [255, 69, 0, 40],
          getLineColor: [255, 69, 0, Math.round(120 + 80 * (pulseScale - 1))],
          stroked: true,
          lineWidthMinPixels: 2.5,
          getRadius: 8000,
          radiusScale: pulseScale,
          radiusMinPixels: Math.round(12 * pulseScale),
          radiusMaxPixels: Math.round(22 * pulseScale),
          pickable: false,
          updateTriggers: {
            getLineColor: [pulseScale],
            radiusScale: [pulseScale],
          },
        }),
      );
    }

    if (showArcs && arcs.length > 0) {
      result.push(
        new ArcLayer({
          id: "kg-lineage",
          data: arcs,
          getSourcePosition: (d) => [d.fromLng, d.fromLat],
          getTargetPosition: (d) => [d.toLng, d.toLat],
          getSourceColor: [234, 179, 8, 200],
          getTargetColor: [234, 179, 8, 200],
          getWidth: 1.5,
          greatCircle: true,
        }),
      );
    }

    return result;
  }, [filtered, focusEntity, pulseScale, showArcs, arcs, selectedEntity?.id]);

  const overlayProps = useMemo<MapboxOverlayProps>(
    () => ({
      interleaved: false,
      layers,
      onHover: handleHover,
      onClick: handleClick,
    }),
    [layers, handleHover, handleClick],
  );

  const legendTypes = ["monastery", "place", "person", "school"] as const;

  return (
    <div className="relative h-full min-h-[480px] w-full" data-testid="places-map-canvas">
      <Map
        ref={mapRef}
        reuseMaps
        mapStyle={mapStyle}
        initialViewState={INITIAL_VIEW}
        onError={onMapError}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <DeckOverlay {...overlayProps} />
      </Map>

      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 max-w-[240px] rounded-md border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)]/95 px-3 py-2 text-xs shadow-md backdrop-blur-sm"
          style={{ left: tooltip.x + 12, top: tooltip.y - 8 }}
        >
          <p className="font-medium text-[var(--jx-ink-classical)]">{tooltip.entity.name_zh}</p>
          <p className="text-[var(--muted)]">{labelType(tooltip.entity.entity_type)}</p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex flex-wrap gap-3 rounded-lg border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)]/90 px-3 py-2 text-[11px] backdrop-blur-sm">
        {legendTypes
          .filter((t) => entityTypes.includes(t))
          .map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-[var(--muted)]">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ background: MAP_TYPE_COLORS[t] }}
              />
              {labelType(t)}
            </span>
          ))}
        {showArcs && (
          <span className="flex items-center gap-1.5 text-[var(--muted)]">
            <span className="inline-block h-0.5 w-4 bg-amber-400" />
            师承
          </span>
        )}
      </div>

      {selectedEntity && (
        <MapEntityPopup entity={selectedEntity} onClose={onClosePopup} />
      )}
    </div>
  );
}
