# /places 佛教地理 FoJin 对齐重设计

> 日期：2026-06-06  
> 状态：已实施  
> 作者：jingxin

## 目标

修复地理 API 返回空数据的 SQL bug，将 `/places` UI/交互对齐 FoJin `KGMapPage`，并补齐 Wikidata 人物坐标与高德寺院 enrichment 管线。

## 问题与修复

### SQL bug

`listPlaceEntities` 原先对无坐标实体 `LIMIT 1500` 后再 JS 过滤坐标，导致 19k+ DILA 地点无法返回。修复：在 SQL 层过滤 `json_extract(properties, '$.lat') IS NOT NULL`（兼容 `latitude`）。

### UI 差距

| FoJin | 静心（实施后） |
|-------|----------------|
| 全宽地图 + 顶部工具栏 | `PlacesExplorer` 全宽布局 |
| 搜索 fly-to + popup | OpenCC 变体搜索 + Deck.GL fly-to + `MapEntityPopup` |
| 纯中文 / 师承 / 图例 | 已实现 |
| 80k 实体 | API limit 25k（可扩至 200k） |

## 数据 enrichment

| 命令 | 数据源 |
|------|--------|
| `kg:import:dila:place` | DILA place.rdf |
| `kg:enrich:person-geo` | Wikidata SPARQL（佛教人物 + P625） |
| `kg:enrich:amap-monasteries` | 本地 `data/amap_temples_v3.json` |

人物地图可见性：`geo_source` 须为 `wikidata:*` / `city_match*` / `province_match*`（CN bbox）或 `desc_match_v3:*`。

## 关键文件

- `lib/kg/geo.ts` — 共享类型与 SQL 片段
- `lib/kg/graph.ts` — `getKgGeoEntities` / `listPlaceEntities`
- `components/places/places-explorer.tsx` — 主 UI
- `components/kg/kg-map-deck.tsx` — Deck.GL 渲染（Map 根 + MapboxOverlay overlaid 模式）

## 底图集成

Deck.GL 层通过 `@deck.gl/mapbox` 的 `MapboxOverlay` 挂载在 `react-map-gl/maplibre` 的 `Map` 根组件上（非 reverse-controlled）。底图回退链：MapTiler（`NEXT_PUBLIC_MAPTILER_KEY`）→ Carto Positron → OSM raster；style 加载失败时 `onError` 自动降级。
- `tests/kg/geo.test.ts` — SQL 回归

## 验收

- [x] `/api/kg/geo` 在有 DILA 导入时返回 >0
- [x] `/places` 全宽地图 + 工具栏 + 统计 badge
- [x] 搜索与 `?focus=` fly-to
- [x] enrichment CLI + 单元测试
- [x] E2E places smoke 升级

## 参考

- FoJin：`fojin/frontend/src/pages/KGMapPage.tsx`
- 计划：`places-fojin-redesign`
