# 知识图谱搜索与 FoJin 完整对齐

> 日期：2026-06-06  
> 状态：已实施  
> 作者：jingxin

## 背景

首轮 FoJin 重设计已实现三栏探索器与 API，但用户反馈「看不到搜索框」，且与 FoJin 仍有明显差距。根因是搜索藏在左栏 240px 侧栏内，且 `stats.totalEntities === 0` 时整页不渲染。

## 目标

1. 顶部主搜索条始终可见（含空数据场景）
2. 补齐 FoJin 级 UI：类型筛选、图例、可折叠统计、时间轴、描述提及回退、截断提示
3. 修复 slug/id 状态与 URL 同步 bug
4. 典籍关系优先链到 `/sutra/[slug]`

## 变更摘要

### 布局

- 新增 `KgToolbar`：`data-testid="kg-main-search"` 主搜索 + 类型下拉 + 深度 slider + 搜索按钮
- `KgSearchPanel` 改为纯结果列表
- 三栏 grid 始终渲染；空数据仅显示提示条，不隐藏搜索

### 新增组件

| 组件 | 职责 |
|------|------|
| `kg-toolbar.tsx` | 主搜索工具栏 |
| `kg-legend.tsx` | 图区动态图例 |
| `kg-timeline.tsx` | 简化时间轴 |
| `kg-mentions-panel.tsx` | 无关系时描述提及 |

### API / 数据

- `GET /api/kg/mentions?slug=` — `lib/kg/mentions.ts` 扫描 description
- `getKgStats()` 扩展 `relationCounts` 按 predicate 分组
- `getSutraSlugForTextEntity()` — 典籍关系链经目

### 状态约定

- `selectedEntityId` 始终存 `kg:…` 全 ID
- URL `slug` 参数仅存友好 slug
- `handleNodeClick` 使用 `entityIdToSlug(node.id)`

## 验收

- [x] `/kg` 首屏可见 `kg-main-search`
- [x] 类型筛选、深度、关系 checkbox 可用
- [x] 图例、截断提示、统计折叠
- [x] 无关系实体显示提及面板
- [x] 时间轴开关与点击激活
- [x] 单元测试 + E2E 通过

## 参考

- FoJin：`fojin/frontend/src/pages/KnowledgeGraphPage.tsx`
- 增量于：`docs/superpowers/specs/2026-06-06-kg-fojin-redesign-design.md`
