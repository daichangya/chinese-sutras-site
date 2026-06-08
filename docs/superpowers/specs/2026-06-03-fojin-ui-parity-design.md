# 静心 UI 向 FoJin 对齐 — 设计规格

> 日期：2026-06-03  
> 状态：已实施  
> 作者：jingxin

## 目标

在保留静心「纸色深读」品牌、**不引入 Ant Design** 的前提下，通过设计 token 收敛、发现层门户化、阅读层沉浸优先，缩小与 FoJin 的界面体验差距。

## 策略（路线 C）

| 层次 | 策略 |
|------|------|
| Token | 水墨 `#2b2318`、朱砂 `#8b2500`、金 `#b08d57` 作壳层别名；正文仍用 Noto Serif + `prose-jx` |
| 发现层 | 首页/搜索/辞典/经藏/图谱：FoJin 式门户密度与布局 |
| 阅读层 | 经页保持沉浸；补齐图标工具栏与 xl 以下抽屉化侧栏 |
| 组件 | 扩展 `components/ui/` 与 `globals.css` 工具类，不引入 Ant Design |

## Token 映射

| CSS 变量 | 值 | 用途 |
|----------|-----|------|
| `--jx-ink-classical` | `#2b2318` | 标题、导航 |
| `--jx-accent-cinnabar` | `#8b2500` | 主 CTA、搜索按钮 |
| `--jx-gold` | `#b08d57` | 装饰线、统计数字 |
| `--jx-ui-font` | PingFang / Noto Sans SC | 壳层 UI |
| `--jx-reading-font` | Noto Serif SC | 经文、辞典释义 |

## 分页面交付

### UI-0：Token + 导航

- `app/globals.css`：FoJin 对齐别名与工具类（`.jx-ui-shell`、`.jx-combo-search`、`.jx-portal-hero`、`.jx-section-block` 等）
- `components/ui/button.tsx`、`tabs.tsx`：统一 jx token
- `components/layout/site-header.tsx`、`mobile-nav.tsx`：Lucide icon + 文字，补 `/places` 地理入口

### UI-1：首页门户化

- Combo 搜索条、`HomeStatsBar` 上移 hero、3×2 密网格 `HomeFeatureCards`
- 「今日经句」下移至第二屏

### UI-2：统一搜索 facet

- `components/search/search-facet-sidebar.tsx`（`data-testid="search-facet-sidebar"`）
- `lib/search/filter-results.ts`：部类 / 白话经目筛选
- 结果分区 `.jx-section-block`，snippet 高亮 `.jx-search-mark`

### UI-3：阅读器

- `components/reader/reader-toolbar.tsx`（`data-testid="reader-toolbar"`）：目录、A±、收藏、分享、对读、字帖、AI、相似段
- `components/reader/reader-panel-drawer.tsx`：xl 以下 TOC / AI / 相似段抽屉互斥
- xl 桌面：TOC 左栏 + AI/相似段右栏常驻

### UI-4：次级页面

- 辞典：源 chip 朱砂态、结果 `md:grid-cols-2`
- KG：固定高度图区 + 实体说明侧栏（`data-testid="kg-graph-layout"`）
- Places：地图区 `min-h-[480px]`（`data-testid="places-map-layout"`）
- Chat：空态热门问题卡片（`data-testid="chat-hot-question"`）、引用 chip 朱砂样式

## 刻意不做

- 不引入 Ant Design 整站
- 不复制 FoJin 503 源选择器、8 法师人格、BYOK UI
- 不把经页改成 sans-serif 高密度 CBETA 流式排版
- 不从 fojin.app 抓图/爬样式

## 测试

- 单元：`tests/search/filter-results.test.ts`
- E2E：`e2e/fojin-parity.spec.ts` 扩展首页 stats/6 宫格、搜索 facet、阅读器工具栏
- 验收：`npm run verify`（build + test + e2e）

## 参考

- FoJin 前端：`fojin/frontend/`
- 静心读者规格：`docs/superpowers/specs/2026-05-30-jingxin-reader-design.md`
- 架构分析：`docs/fojin-architecture-analysis.md`
