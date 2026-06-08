# 发现层页面覆盖

> 覆盖 MASTER.md 中发现层相关规则

## 布局

- 容器：`DiscoveryLayout` → `.jx-page` (1200px) + `animate-jx-fade`
- 页头：`PageHeader` 组件（label + h1 + description）
- 可选侧栏：`lg+` 左侧 facet sidebar（搜索页），宽度 `--jx-sidebar-width`
- 主内容：`flex-1 min-w-0`

## PageHeader 规范

```tsx
<PageHeader
  label="辞典"           // jx-section-label, accent 时用 gold
  title="佛教辞典"        // text-2xl/3xl, jx-ink-classical
  description="..."      // optional, muted
  accent                 // label 用 gold 色
/>
```

- 页头与内容间距：`mb-8` (mobile) / `mb-10` (desktop)
- 禁止每页手写 `jx-section-label + h1` 重复块

## FilterBar

- 筛选 pill 统一用 `FilterBar` + `Chip`
- 禁止 inline `rounded-full px-3 py-1.5` 按钮
- 横向滚动容器：`overflow-x-auto` + `gap-2`

## 响应式断点

| 断点 | 布局 |
|------|------|
| 375px | 单列，filter 可横滚 |
| 768px | 页头 title 放大 |
| 1024px | 搜索页显示 facet sidebar |
| 1440px | 内容居中，不超出 jx-page |

## 配色

- section label：`--jx-gold`（accent 模式）
- CTA / 高亮：`--jx-accent-cinnabar`
- 禁止 `amber-*`

## 代表页面

搜索、辞典、经藏、图谱、地理、收藏、关于、人物
