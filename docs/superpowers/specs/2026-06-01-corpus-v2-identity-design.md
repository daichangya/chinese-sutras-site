---
title: jingxin 语料 V2（Anchor + Canonical ID）设计
date: 2026-06-01
author: jingxin
status: draft-approved
---

## 1. 背景与目标

本设计用于支撑长期可维护的全藏语料库与数据库导入链路：

```text
CBETA 全藏 XML
↓
Markdown 语料库（内容真相源）
↓
数据库（运行时）
```

核心目标：

- **全藏规模可落地**：避免“每段一个文件”导致百万级文件数。
- **身份稳定**：升级 parser、调整 `stripPreface`、调整分片策略后，白话/注释/讲记/收藏/向量索引等关联数据仍可稳定继承。
- **可解释可审阅**：主键与标题键能从肉眼读出 CBETA 坐标，便于 Git diff、人工校对、批量修订。

非目标：

- 本文不规定前端阅读 UI/搜索 UI；只约束语料层与导入契约。
- 本文不引入“品/章/节”等不稳定逻辑结构作为永久主键组成部分。

## 2. 核心概念：Anchor vs Canonical ID vs Parser PID

本设计强制区分三类 ID：

### 2.1 Anchor（定位坐标，CBETA 原生）

Anchor 用于描述文本在 CBETA 页栏行体系中的**坐标跨度**：

- `start_ref`: `p{pb}{col}{line}`，如 `p0001a01`
- `end_ref`: 同上，如 `p0001a08`

其中：

- `pb`: 四位页码（`0001`）
- `col`: 栏位（`a|b|c` 等，具体由 CBETA `lb/@n` 决定）
- `line`: 两位行号（`01`）

推荐同时保存拆分字段，避免字符串解析歧义：

- `start_pb`, `start_lb`
- `end_pb`, `end_lb`

> 约束：Anchor 只用于“定位与解释”，不参与“内容是否同一对象”的语义判断。

### 2.2 Canonical ID（永久身份，Span Identity）

Canonical ID 是语料库中“文本块”的永久身份，用于绑定：

- 白话
- 注释
- 讲记
- 用户收藏/笔记
- 向量索引条目
- 外部引用/修订追踪

Canonical ID **不允许**基于 `hash(content)`、`paragraph_seq`、`chapter_seq`、`file_seq` 等解析产物。

Canonical ID 采用 **Span Identity**：

```text
{cbeta_id}:{start_ref}-{end_ref}
```

示例：

- `T01n0001:p0001a01-p0001a08`
- `T01n0001:p0001b20-p0002a06`
- `X55n0873:p0123c05-p0124a11`

> 约束：Canonical ID 一旦发布禁止变更；语料再生成时必须优先复用旧的 Canonical ID（若无法匹配，走别名/迁移策略）。

### 2.3 Parser PID（运行时身份，仅当前生成版本）

Parser PID 用于：

- 数据库导入排序
- 日志与调试
- 快速定位生成时的段落序号

示例：`p000001` / `para-000001`

> 约束：Parser PID 不用于任何跨版本关联，不得作为外部 API 的稳定标识。

### 2.4 内容校验：content_hash（辅助字段）

`content_hash` 用于：

- 检测内容变更（标点/正字/勘误/规范化）
- 检测 parser 漂移（同 canonical_id 但正文被意外改动）
- 检测语料升级差异（回归审计）

> 约束：`content_hash` 不参与主键语义；内容修订不应导致 canonical_id 变化。

## 3. 目录结构（V2）

语料根目录：`corpus/`

```text
corpus/
├── catalog/
│   ├── T01n0001.yaml
│   ├── T01n0002.yaml
│   └── ...
└── content/
    ├── T01n0001/
    │   ├── part-001.md
    │   ├── part-002.md
    │   └── ...
    └── T01n0002/
```

说明：

- `catalog/{cbeta_id}.yaml` 是**经级元数据唯一真相源**。
- `content/{cbeta_id}/part-XXX.md` 为物理分片文件，单文件承载多段落块（建议阈值沿用现行：约 200 段或 80k 字）。

## 4. 经级元数据（catalog）

文件：`corpus/catalog/{cbeta_id}.yaml`

推荐字段（可扩展）：

```yaml
cbeta_id: T01n0001
title: 長阿含經
title_simplified: 长阿含经
translator: 佛陀耶舍共竺佛念譯
dynasty: 後秦
category:
  - 阿含部
juan_count: 22
source_xml:
  - T/T01/T01n0001.xml
aliases:
  - 长阿含
```

约束：

- `cbeta_id` 必填且唯一。
- 其他字段可缺省；但不得在内容文件中重复维护（避免多处漂移）。

## 5. 内容文件格式（part-XXX.md）

### 5.1 文件级 frontmatter（最小集）

文件：`corpus/content/{cbeta_id}/part-XXX.md`

```yaml
---
cbeta_id: T01n0001
part: 1
block_count: 200
start_ref: p0001a01
end_ref: p0003b12
generated_at: 2026-06-01
source_xml: T/T01/T01n0001.xml
---
```

说明：

- `start_ref/end_ref` 用于文件级粗定位与审计，不作为块主键。
- `block_count` 为该文件包含的“文本块”数量（非行数）。

### 5.2 Section 结构（正文/白话/注释/讲记）

内容采用多 section，并用标题键对齐：

```md
## 正文

### T01n0001_p0001a01

（块正文……）

## 白话

### T01n0001_p0001a01

（可空；人工/AI 生成后填写）

## 注释

### T01n0001_p0001a01

（可空）

## 讲记

### T01n0001_p0001a01

（可空）
```

### 5.3 标题键（人可读 Anchor Key）

为兼顾“可读性”和“永久绑定”，标题键采用**可逆推 CBETA 起点坐标**：

```text
{cbeta_id}_{start_ref}
```

示例：`T01n0001_p0001a01`

约束：

- 标题键必须可逆推出：经号 + 起点页栏行。
- 标题键不是永久主键；永久主键见块级元数据。

### 5.4 块级元数据（强制）

每个块在“正文 section”内必须携带一段 YAML（建议放在正文块紧邻位置；格式可选其一，以下给出推荐写法）。

推荐写法：在正文块标题下第一段用 `:::meta` fenced block（或其他明确标记，具体实现阶段再确定解析器）。

规范字段（最小集）：

```yaml
canonical_id: T01n0001:p0001a01-p0001a08
start_ref: p0001a01
end_ref: p0001a08
parser_pid: p000001
content_hash: 5d9af3
```

约束：

- `canonical_id` 必填；格式必须满足 `cbeta_id:start_ref-end_ref`。
- `start_ref` 必须与标题键中的 `start_ref` 一致。
- `end_ref` 必填（用于唯一化该块跨度）。
- `content_hash` 推荐必填（用于审计）；hash 算法与规范化策略由实现阶段确定（例如去除空白、统一标点形式等）。
- `parser_pid` 可选但建议保留（导入/调试用）。

> 注：如果不引入 fenced meta block，也可改为在 `###` 下紧跟一段 `yaml` 代码块；关键是“机器可解析且不影响正文阅读”。此处只规定字段与约束，不锁定具体语法。

## 6. 生成与再生成的稳定性策略

### 6.1 允许变动的内容

以下变化不应导致 canonical_id 变化：

- 标点修复
- 正字/简繁修正
- 勘误（choice/corr 等）
- parser 文本提取 bug 修复（如 inline `<p>` 属性泄漏）

它们应通过 `content_hash` 变化体现，便于审计与回归。

### 6.2 块边界变化（合并/拆分）如何处理

当 parser 规则变化导致块边界改变（例如 A+ B 合并成一个块，或 A 拆成 A1/A2）：

- 新块会产生新的 canonical_id（新的跨度）。
- 旧 canonical_id **不得删除**，需要进入别名/迁移机制（见下一节）。

## 7. 别名与迁移（必须预留）

为保证历史数据（白话/注释/收藏/向量索引）不因块边界变化而断链，必须支持：

- `aliases`: 旧 canonical_id → 新 canonical_id 的映射（可以放在 `catalog/{cbeta_id}.yaml` 或单独的 `aliases/{cbeta_id}.yaml`）
- 迁移策略（优先级）：
  1. **完全覆盖**：旧 span 被某个新 span 完全覆盖 → 迁移到该新 span
  2. **最大交集**：旧 span 与多个新 span 相交 → 迁移到交集最大的 span，并记录需人工确认
  3. **无法匹配**：保留旧记录为“orphaned”，提示人工处理

> 约束：迁移是数据层能力，不应要求修改历史 Markdown 才能修复断链。

## 8. 数据库与向量化建议（面向 RAG）

### 8.1 入库字段建议（每块）

最小入库对象（示意）：

```json
{
  "canonical_id": "T01n0001:p0001a01-p0001a08",
  "cbeta_id": "T01n0001",
  "start_ref": "p0001a01",
  "end_ref": "p0001a08",
  "parser_pid": "p000001",
  "content": "如是我聞……",
  "translation": "我听佛这样说……",
  "commentary": "舍衛國……",
  "lecture": "本段属于……",
  "content_hash": "5d9af3"
}
```

### 8.2 向量化建议

推荐 embedding 文本为（按需拼接、带标签）：

```text
正文: ...
白话: ...
注释: ...
讲记: ...
```

优点：

- 白话/注释提供现代语义，通常显著提升检索召回与答案可读性。
- canonical_id 稳定绑定用户数据与向量库条目，便于增量更新。

## 9. 测试与验收（规范层）

验收标准（设计层，供实现阶段落地）：

1. 任意一次重新生成（修 parser / stripPreface / 调分片阈值）后：
   - 同一块若 Anchor span 不变，则 canonical_id 不变。
   - content_hash 可变且可审计。
2. 不允许出现“每段一个文件”的输出形态（全藏规模下需保持文件数可控）。
3. Markdown diff 可读（标题键可逆推坐标；catalog 单一真相源）。

