# jingxin 五期：白话分层 + 沉浸视觉

**日期：** 2026-05-31  
**作者：** jingxin  
**状态：** 已实现

---

## 目标

在 post-MVP 四期之上：

1. **A** — 11 经分层白话语料 + `colloquial:batch` / `colloquial:check` + Vitest 门禁  
2. **B** — design tokens（40% 无尽藏 / 30% 大藏经 AI / 20% Notion / 10% Medium）+ 首页/阅读器视觉

## 白话分层

| Tier | slug | 范围 | 门禁 |
|------|------|------|------|
| core | xinjing, jingangjing | 全部 | ≥80% |
| intro | 6 部净土/菩萨/禅 | 前 50 段 | ≥70% |
| long | fahuajing, liangyanjing, zhonglun | chapter_seq=0 前 50 段 | ≥70% |

配置：[`lib/colloquial/tiers.ts`](../../../lib/colloquial/tiers.ts)

## 视觉 token

[`app/globals.css`](../../../app/globals.css)：`--jx-paper`、`--jx-measure`、`--jx-sidebar-width`、`jx-sutra-card`、`jx-ai-panel`、`jx-section-label`。

## 验收

- `npm run colloquial:check` 全 OK  
- `npm test` 含 `colloquial-coverage.test.ts`  
- `npm run e2e` 含 `popular-sutra-grid`、`reader-ai-panel` testid
