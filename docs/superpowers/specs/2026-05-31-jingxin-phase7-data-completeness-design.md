# jingxin 七期：MVP 数据补全

**日期：** 2026-05-31  
**作者：** jingxin  
**状态：** 已实现

---

## 目标

在完整 `vendor/xml-p5` 前提下，按 **A→B→C** 补全 MVP 11 经：

1. **A** — 经文原文 Markdown + SQLite + FTS  
2. **B** — 五期 tier 白话（首期 `AI_MOCK=1`）  
3. **C** — 专题、今日经句 seed

不扩经目、不导入全藏。

## 流水线

```bash
npm run corpus:refresh
# 等价于 corpus:gen --clean-stale → AI_MOCK colloquial:batch → corpus:import → seed:topics → seed:daily → audit
```

| 脚本 | 作用 |
|------|------|
| [`scripts/gen-cbeta-markdown.ts`](../../../scripts/gen-cbeta-markdown.ts) | `--clean-stale` 删除未再生的分片 md |
| [`scripts/corpus-refresh.ts`](../../../scripts/corpus-refresh.ts) | 一键流水线 |
| [`scripts/corpus-audit.ts`](../../../scripts/corpus-audit.ts) | 11 经文件数/段落数表 |
| [`lib/corpus/audit.ts`](../../../lib/corpus/audit.ts) | 审计逻辑 + `MVP_MIN_PARAGRAPHS` 门禁 |

## 七期 audit 基线（2637 段）

| slug | files | paragraphs |
|------|-------|------------|
| xinjing | 1 | 7 |
| jingangjing | 1 | 125 |
| dizangjing | 1 | 148 |
| amituojing | 1 | 26 |
| fahuajing | 3 | 434 |
| liangyanjing | 3 | 524 |
| liuzutanjing | 1 | 133 |
| weimojiejing | 2 | 329 |
| zhonglun | 4 | 678 |
| wuliangshoujing | 1 | 187 |
| guanwuliangshoujing | 1 | 46 |

## 验收

- `npm run colloquial:check` 全 OK  
- `npm test` 含 `mvp-corpus-completeness.test.ts`  
- `npm run build` + `npm run e2e`

## 明确不做

- 非 MVP 经目批量导入  
- 白话人工校对（仍见 `docs/content-review.md`）  
- V3 问经
