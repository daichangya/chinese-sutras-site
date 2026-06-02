---
title: jingxin 语料入库与 slug
date: 2026-06-01
author: jingxin
status: approved
extends: docs/superpowers/specs/2026-06-01-corpus-v3-readable-md-design.md
---

## 1. slug 契约

- **不在** `原文/*.md` 中写 slug 或工程 frontmatter。
- `meta.yaml` 必填 `cbeta_id`；`slug` **可选覆盖**，默认由 `slugFromCbetaId(cbeta_id)` 推导（`T01n0001` → `t01n0001`）。
- 语料目录名仍用中文经名；URL slug 与目录名不必一致。

## 2. 身份侧车 `_index/blocks.jsonl`

生成时写入（随 `corpus/` 提交 git）：

```text
corpus/{部类}/{经名}/_index/blocks.jsonl
```

每行 JSON：

```json
{"canonical_id":"T01n0001:p0001b12-p0001b12","start_ref":"p0001b12","end_ref":"p0001b12","content_hash":"f4364a806632","parser_pid":"p000001","juan_num":1,"kind":"prose"}
```

与 `原文/第NNN卷.md` 段落顺序严格一致。

## 3. 导入模式

| 模式 | CLI | 身份来源 | 正文来源 |
|------|-----|----------|----------|
| 双源（默认） | `corpus:import` | XML + `_index` 交叉校验 | MD |
| 纯语料 | `corpus:import -- --md-only` | `_index/blocks.jsonl` | MD |

VPS 部署：仅提交 `corpus/`（含 `_index`），不依赖 `vendor/xml-p5`。

## 4. 卷 / chapter

- `chapter` 表：每卷一行，`seq = juan_num`，`title` 为卷标题。
- `paragraph.juan_seq`：段落所属卷号（0 = 全文单卷）。
- 阅读器按 `juan_seq` 分页（查询层别名 `chapterSeq` 保持兼容）。

## 5. 实现模块

| 模块 | 职责 |
|------|------|
| `lib/cbeta/series-label.ts` | `slugFromCbetaId` |
| `lib/corpus-v3/blocks-index.ts` | 读写 `_index/blocks.jsonl` |
| `lib/corpus-v3/gen.ts` | 生成 MD + blocks.jsonl |
| `lib/corpus-v3/import-align.ts` | 组装 ImportSutraBundle |
| `scripts/import-corpus.ts` | 写入 SQLite + chapter |
