# 首页页面覆盖

> 覆盖 MASTER.md 中首页相关规则

## Hero

- `min-h-[calc(100vh-var(--jx-header-height))]`，内容垂直居中
- 内容列：`.jx-hero-content`（`--width-jx-hero` 75rem / 1200px）
- 背景：`.jx-hero-bg` CSS 水墨渐变（无外部图片依赖）
- 标题：`Ma Shan Zheng`，88px desktop / 48px mobile，字间距 0.2em
- 副标题：字间距 0.5em，`--jx-ink-light`
- Combo 搜索：`.jx-combo-search`（`--width-jx-combo` 48.75rem / 780px）
- 热门 chips / 统计行：`max-w-4xl`，随 hero 全宽
- Combo 搜索 + 热门 chips + 统计行 + 6 宫格均在首屏

## 第二屏

- 今日经句、热门经典、专题阅读
- 使用 `SectionHeader` 组件

## 配色

- section label 用 `--jx-gold`
- CTA 全部 `--jx-accent-cinnabar`
- 禁止 `amber-*`

## 响应式断点

| 断点 | 调整 |
|------|------|
| 375px | 标题 48px，combo 搜索全宽，chips 横滚 |
| 768px | 标题 64px，stats 两列 |
| 1024px | 标题 88px，feature cards 3 列 |
| 1440px | hero 内容居中于 jx-hero-content |
