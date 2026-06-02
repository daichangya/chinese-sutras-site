# jingxin 六期：全站视觉收尾

**日期：** 2026-05-31  
**作者：** jingxin  
**状态：** 已实现

---

## 目标

在五期 design tokens 基础上，将专题、搜索、收藏、关于等次级页面统一到同一套「静心」纸色与卡片语言。不扩功能、不改 DB/API。

## 新增 / 复用 token

[`app/globals.css`](../../../app/globals.css)：

| 类名 | 用途 |
|------|------|
| `jx-page` | 次级页容器 `max-w-4xl`、与首页对齐的内边距 |
| `jx-input` | 搜索框，纸色底 + focus ring |
| `jx-list-card` | 列表卡片 alias（与 `jx-sutra-card` 同系阴影） |
| `jx-sutra-card` | 经目/结果/收藏项（复用五期） |
| `jx-section-label` | 区块小标题（复用五期） |

## 页面改造

| 路由 | 变更 |
|------|------|
| `/topic/[slug]` | `jx-page`、hero 对齐 `DailyVerseCard`、`topic-sutra-list` |
| `/search` | `jx-section-label` 标题区、结果/空态 `jx-sutra-card`、`search-results` / `search-empty` |
| `/bookmarks` | `jx-page` + `bookmarks-list` |
| `/about` | `jx-page` + section label 分段 |
| `/verse/today` | `jx-page` + `jx-section-label`（核对 token 变量） |
| `site-footer` | `--jx-muted-label` |

## 不在本期

- V2 划选高亮 / `user_annotation`
- V3 问经 RAG
- Lighthouse CI 脚本

## 验收

- `npm test` + `npm run build` + `npm run e2e` 全绿
- E2E：`topic-sutra-list`、`search-empty`、`bookmarks-list`（空态亦可）
- 人工：首页 → 专题 kongxing → 搜索 → 收藏 → 关于，纸色与卡片一致
