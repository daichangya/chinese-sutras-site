---
title: jingxin 语料 V3（可读 Markdown + DB 身份）
date: 2026-06-01
author: jingxin
status: approved
supersedes: docs/superpowers/specs/2026-06-01-corpus-v2-identity-design.md
---

## 1. 目标

- **Markdown 只给人读**：像小说站 / 文库，无 `canonical_id`、无 yaml 块、无 `### T01n0001_p0001a05` 工程标题。
- **身份在导入时从 XML 计算**：`corpus:import` 双源对齐（XML → 身份；MD → 展示正文）。

## 2. 目录

```text
corpus/{部类}/{经名}/
├── meta.yaml
├── 原文/第001卷.md | 全文.md
├── 白話/
└── 注釋/
```

## 3. meta.yaml

```yaml
cbeta_id: T01n0001
title: 長阿含經
translator: 後秦 佛陀耶舍共竺佛念譯
dynasty: 後秦
category: 阿含部
juan_count: 22
source_xml:
  - T/T01/T01n0001.xml
```

## 4. 卷文件示例

```md
# 長阿含經 · 第一卷

> 後秦 佛陀耶舍共竺佛念譯

---

## 大本經第一

如是我聞：

一時，佛在舍衛國祇樹給孤獨園。
```

## 5. 导入契约

- `paragraph.id` = `canonical_id` = `{cbeta_id}:{start_ref}-{end_ref}`（由 [`lib/cbeta/structure.ts`](../../lib/cbeta/structure.ts) 自 XML 生成）
- MD 段落按**卷内顺序**与 XML 块对齐；`content_hash` 不一致时告警并采用 MD 正文
- 白话 / 注释：同卷同名文件，同序段落写入 `colloquial` / `commentary`

## 6. 实现模块

| 模块 | 职责 |
|------|------|
| `lib/cbeta/structure.ts` | 卷 / 品目 / 段落 / 偈颂 |
| `lib/corpus-v3/gen.ts` | XML → 文库目录 |
| `lib/corpus-v3/import-align.ts` | XML + MD → 导入包 |
| `scripts/gen-corpus.ts` | CLI 生成 |
| `scripts/import-corpus.ts` | CLI 导入 |

## 7. V2 废弃

不再使用 `corpus/catalog/`、`corpus/content/part-*.md` 及块内 yaml meta。
