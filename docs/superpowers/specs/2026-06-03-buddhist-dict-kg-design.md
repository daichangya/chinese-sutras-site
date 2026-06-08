# 汉传辞典与知识图谱（Corpus V3 扩展）

**日期：** 2026-06-03  
**作者：** jingxin  
**状态：** 已实施（数据层 + SQLite + 阅读器查词 MVP）

## 目标

在 `chinese-sutras-md/` 根下新增 `辞典/`、`知识图谱/` 真相源（JSONL/YAML），从 DILA 等公开上游导入；汉传核心约 10–14 部辞典 + 完整 KG 语义；经 `migrate.ts` 进入 SQLite，供阅读器划选查词与译者人物卡片。

## 目录布局

```text
chinese-sutras-md/
  辞典/
    catalog.yaml
    sources/丁福保佛学大辞典/entries.jsonl
  知识图谱/
    catalog.yaml
    entities.jsonl
    relations.jsonl
    geo/
    logs/import-errors.jsonl
  经藏/
    般若/ …（23 部类经目）
```

## 路径 API

| 函数 | 默认路径 |
|------|----------|
| `resolveCorpusRoot()` | `CORPUS_DIR` 或 `chinese-sutras-md` |
| `resolveSutrasRoot()` | `{corpus}/经藏`（非空时），否则兼容扁平 `{corpus}/{部类}` |
| `resolveDictRoot()` | `{corpus}/辞典`，可 `DICT_DIR` 覆盖（兼容旧 `dictionaries/`） |
| `resolveKgRoot()` | `{corpus}/知识图谱`，可 `KG_DIR` 覆盖（兼容旧 `knowledge-graph/`） |

`findSutraMetaFiles` 从 `resolveSutrasRoot()` 扫描；语料库根 depth=0 跳过 `辞典`、`知识图谱`、`经藏`（及旧英文名目录）。

## 辞典 schema

`DictionaryEntryRecord`（JSONL 单行）：

- `id`: `{source}:{slug}`
- `source`, `headword`, `definition`, `lang`
- 可选：`reading`, `license`, `entry_data`

## KG schema

**实体** `KgEntityRecord`：`id`, `entity_type`（person|place|monastery|text|concept|dynasty|school）, `name_zh`, `name_en`, `external_ids`, `properties`, `source_tier`, `source`, `text_id`

**关系** `KgRelationRecord`：`subject_id`, `predicate`, `object_id`, `confidence`, `source`

## CLI

| 命令 | 说明 |
|------|------|
| `dict:import:dila --source soothill [--limit N]` | DILA TEI ZIP → JSONL |
| `dict:import:all-han` | 批量 DILA 可导入源 |
| `dict:stats` | 条目审计 |
| `dict:import:sqlite` | JSONL → SQLite FTS |
| `kg:import:dila` | DILA person.rdf → entities/relations |
| `kg:extract:corpus` | meta.yaml → 经目/译者/朝代 |
| `kg:extract:cbeta-notes` | 题名规则经间关系（KG-3 轻量） |
| `kg:enrich:geo` | 地理占位/扩展 |
| `kg:merge` | 去重报告 |
| `kg:import:sqlite` | JSONL → SQLite |

## SQLite 表

- `dict_source`, `dict_entry` + `dict_entry_fts`（FTS5）
- `kg_entity`, `kg_relation`, `kg_entity_text`

## 许可

逐源记录在 `catalog.yaml`；禁止从 fojin.app 爬取 bulk 数据；大 JSONL 与全藏 MD 同策略（本地/gitignore）。

## 验收

1. 保留目录不被 `corpus:import` 当作经目
2. 试点源（soothill、dingfubao、nanshanlu）可导入 JSONL
3. KG-1/2 产生实体与 `translated` 关系
4. `dict:import:sqlite` / `kg:import:sqlite` 后 API `/api/dictionary/lookup`、`/api/kg/person` 可查询
