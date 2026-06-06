/**
 * Deck.GL 地图渲染（仅客户端）
 * @author jingxin
 */
"use client";

import { useMemo } from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, ArcLayer } from "@deck.gl/layers";
import { Map } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { TYPE_COLORS } from "@/lib/kg/labels";

type GeoEntity = {
  id: string;
  slug: string;
  name_zh: string;
  entity_type: string;
  lat: number;
  lng: number;
};

type LineageArc = {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
};

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

export default function KgMapDeck({
  entities,
  arcs,
  onSelect,
  selectedId,
}: {
  entities: GeoEntity[];
  arcs: LineageArc[];
  onSelect: (e: GeoEntity) => void;
  selectedId?: string;
}) {
  const initialViewState = {
    longitude: 105,
    latitude: 35,
    zoom: 3.5,
    pitch: 0,
    bearing: 0,
  };

  const scatterLayer = useMemo(
    () =>
      new ScatterplotLayer<GeoEntity>({
        id: "kg-places",
        data: entities,
        getPosition: (d) => [d.lng, d.lat],
        getRadius: (d) => (d.id === selectedId ? 12000 : 8000),
        getFillColor: (d) => {
          const hex = TYPE_COLORS[d.entity_type] ?? "#a8a29e";
          const [r, g, b] = hexToRgb(hex);
          return [r, g, b, 200];
        },
        pickable: true,
        onClick: (info) => {
          if (info.object) onSelect(info.object as GeoEntity);
        },
        radiusMinPixels: 4,
        radiusMaxPixels: 14,
      }),
    [entities, selectedId, onSelect],
  );

  const arcLayer = useMemo(
    () =>
      arcs.length > 0
        ? new ArcLayer({
            id: "kg-lineage",
            data: arcs,
            getSourcePosition: (d) => [d.fromLng, d.fromLat],
            getTargetPosition: (d) => [d.toLng, d.toLat],
            getSourceColor: [192, 84, 80, 160],
            getTargetColor: [176, 141, 87, 160],
            getWidth: 2,
          })
        : null,
    [arcs],
  );

  const layers = arcLayer ? [scatterLayer, arcLayer] : [scatterLayer];

  return (
    <div className="h-[480px] w-full">
      <DeckGL
        initialViewState={initialViewState}
        controller
        layers={layers}
        style={{ position: "relative" }}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          attributionControl={false}
        />
      </DeckGL>
    </div>
  );
}
