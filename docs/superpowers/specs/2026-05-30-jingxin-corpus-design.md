# jingxin 佛经 Markdown 语料层设计

**日期：** 2026-05-30  
**作者：** jingxin  
**状态：** 已批准，指导 `corpus:gen` / `corpus:import` 实现

---

## 1. 目标

将数据管线从「CBETA TEI XML 直写 SQLite」改为三层结构：

```
vendor/xml-p5  →  corpus/sutras/*.md  →  SQLite (paragraph + FTS5)
     (生成用)         (内容真相源)            (运行时只读)
```

对齐 [chinese-poetry-md](https://github.com/daichangya/chinese-poetry-md)：**Markdown 为真相源**，白话与勘误通过 Git PR 协作；生产 VPS **不必**安装整仓 xml-p5。

---

## 2. CBETA XML 路径

| 项 | 约定 |
|----|------|
| 默认根目录 | `vendor/xml-p5`（相对项目根，已 `.gitignore`） |
| 环境变量 | `CBETA_XML_DIR`，未设置时等同 `vendor/xml-p5` |
| 克隆命令 | `git clone --depth 1 https://github.com/cbeta-org/xml-p5.git vendor/xml-p5` |
| 单经回退 | `tests/fixtures/{cbetaId}.xml`（如 `T08n0251.xml`） |
| 文件解析 | [`lib/cbeta/resolve-path.ts`](../../../lib/cbeta/resolve-path.ts) |

`corpus:gen` **仅**在开发机或 CI 读取 XML；`corpus:import` 与 Next.js **不**读取 XML。

---

## 3. 目录布局

```
corpus/
  README.md
  sutras/
    xinjing.md                 # 小品经：单文件
    dizangjing/
      000-00.md                # 长经：chapter_seq + 分片序号
      000-01.md
```

长经拆分阈值（`corpus:gen` 自动）：单卷段落数 > 200 **或** 字符数 > 80,000。

---

## 4. Markdown 格式

### 4.1 Frontmatter（YAML）

```yaml
---
cbeta_id: T08n0251
slug: xinjing
title: 般若波羅蜜多心經
translator: 唐三藏法師玄奘譯
category: 般若部
chapter_seq: 0
source_xml: T/T08/T08n0251.xml
generated_at: 2026-05-30
---
```

| 字段 | 必填 | 说明 |
|------|------|------|
| `cbeta_id` | 是 | CBETA 经号，如 `T08n0251` |
| `slug` | 是 | 站点 URL slug，与 `MVP_CANON` 一致 |
| `title` | 是 | 经名 |
| `translator` | 否 | 译者 |
| `category` | 否 | 部类 |
| `chapter_seq` | 是 | 分卷序号，小品经为 `0` |
| `source_xml` | 否 | 相对 `vendor/xml-p5` 的路径 |
| `generated_at` | 否 | ISO 日期 |

### 4.2 正文与白话区块

```markdown
## 正文

### T08n0251-c0-p001
觀自在菩薩……

## 白话

### T08n0251-c0-p001
（可空；人工校对后填写）
```

- 三级标题 `### {pid}` 为 **`paragraph.id`**（稳定主键）。
- `pid` 格式：`{cbetaId}-c{chapterSeq}-p{seq}`，`seq` 三位补零（`p001`）。
- `## 白话` 下同名 `### pid` 映射 `paragraph.colloquial`；缺失或空则入库为 `NULL`。
- 空正文段落跳过；重复 `pid` 在同一经内报错。

---

## 5. 脚本契约

### 5.1 `npm run corpus:gen`

- 实现：[`scripts/gen-cbeta-markdown.ts`](../../../scripts/gen-cbeta-markdown.ts)
- 输入：`CBETA_XML_DIR`（默认 `vendor/xml-p5`）+ [`MVP_CANON`](../../../lib/cbeta/mvp-canon.ts)
- 输出：`corpus/sutras/**/*.md`
- 行为：
  - 调用 [`parseCbetaFile`](../../../lib/cbeta/parser.ts) 生成正文与空白话占位。
  - 若目标 MD 已存在且 `## 白话` 非空：**不覆盖**白话（除非 `--force`）。
  - `--slug xinjing` 仅生成指定经。

### 5.2 `npm run corpus:import`

- 实现：[`scripts/import-corpus.ts`](../../../scripts/import-corpus.ts)
- 输入：`corpus/sutras/**/*.md`（`CORPUS_DIR` 默认 `corpus`）
- 输出：upsert `sutra` / `paragraph`，随后 [`fts:rebuild`](../../../scripts/rebuild-fts.ts)
- `sutra.id`：`uuid.v5(cbeta_id, jingxin 命名空间)`，重导入不变。
- `--prune`：删除 corpus 中已不存在的 `paragraph`（按经）。

### 5.3 `npm run import:cbeta`（已弃用）

打印 deprecation，转调 `corpus:import`（不再读 XML）。

### 5.4 `npm run colloquial:generate`

- 仅填充 MD 中空的 `## 白话` 条目（写回 `.md`），然后提示执行 `corpus:import`。
- **不**直接写 SQLite `colloquial`（保持真相源单一）。

---

## 6. 与运行时关系

| 层 | 读取 corpus | 读取 SQLite |
|----|-------------|-------------|
| Next.js 阅读/搜索/AI | 否 | 是 |
| `corpus:gen` | 写 | 否 |
| `corpus:import` | 读 | 写 |

---

## 7. 测试

- 单元：[`tests/corpus/markdown.test.ts`](../../../tests/corpus/markdown.test.ts)
- 集成：`corpus/sutras/xinjing.md` → import → 段落数与 XML parser 一致
- 回归：Vitest + Playwright 在 `seed:demo`（import corpus）后通过

---

## 8. 明确不做

- XML 不入库、不入 corpus 目录。
- 运行时直读 corpus。
- 本阶段不生成全藏 3000+ 经 MD（仅 `MVP_CANON`）。

---

## 附录：与 reader-design 的差异

[`2026-05-30-jingxin-reader-design.md`](2026-05-30-jingxin-reader-design.md) §6 原「CBETA XML → import → SQLite」更新为：

**CBETA XML → `corpus:gen` → Markdown → `corpus:import` → SQLite → FTS5**
