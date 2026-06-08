# chinese-sutras-md 与入库数据「以简体为主」

**日期:** 2026-06-04  
**作者:** jingxin  
**状态:** 已实施

## 目标

网站用户输入与阅读以简体中文为主；语料库保留 CBETA 繁体可追溯，DB/FTS/辞典/KG 统一简体。

## 原则

1. 用户可见数据（`paragraph.text`、FTS、辞典、KG、阅读默认）存简体。
2. `chinese-sutras-md/经藏/.../原文/` 保持繁体（生成、XML 校验）。
3. `简体/` 为可重建简体快照（`corpus:t2s`）；`corpus:import` **优先读 `简体/`**。
4. 需要繁体展示时阅读器按需 `s2t`（不重复存 DB）。

## 经藏导入

[`lib/corpus-v3/import-align.ts`](../../../lib/corpus-v3/import-align.ts)：

- 每卷：`简体/` MD → 直用；否则 `原文/` + `t2s`；无 MD 则 XML + `t2s`。
- 白话/注释层入库前 `t2s`。
- 同时存在 `简体/` 与 `原文/` 且与 `t2s(原文/)` 不一致时 WARN。

## 辞典 / KG

[`lib/han/storage-normalize.ts`](../../../lib/han/storage-normalize.ts)：

- DILA 导入 JSONL、SQLite 导入、语料 KG 抽取、DILA RDF 解析时 `name_zh` / `headword` / `definition` 归一化。
- [`lib/db/dict-kg.ts`](../../../lib/db/dict-kg.ts)、[`lib/kg/graph.ts`](../../../lib/kg/graph.ts) 查询前 `normalizeUserZhQuery`。

## 运维命令

```bash
npm run corpus:t2s
npm run corpus:simplify
npm run corpus:import
npm run fts:rebuild
npm run dict:import:sqlite
npm run kg:import:sqlite
npm run data:health -- --strict
```

## 相关

- [`2026-06-02-db-simplify-design.md`](2026-06-02-db-simplify-design.md)
- [`chinese-sutras-md/README.md`](../../../chinese-sutras-md/README.md)
