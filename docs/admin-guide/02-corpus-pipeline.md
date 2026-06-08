# 02 · 语料流水线

---

## 语料来源

静心支持两条语料路径：

| 来源 | 适用场景 | 命令 |
|------|----------|------|
| **chinese-sutras-md** | 生产/VPS、日常开发 | `corpus:import` |
| **CBETA XML (xml-p5)** | 开发机重新生成 MD | `corpus:gen` → `corpus:import` |

VPS 上只需克隆 `chinese-sutras-md`，**无需** `vendor/xml-p5`。

---

## 导入语料

### 标准导入

```bash
npm run db:migrate
npm run corpus:import
```

### VPS / 仅 Markdown 模式

若环境无 XML 校验能力：

```bash
npm run corpus:import -- --md-only
```

（以 `scripts/import-corpus.ts` 实际支持的 flag 为准。）

### 简体优先流水线（推荐）

网站与 SQLite 以**简体中文**为用户面真相源；语料仓库保留 `原文/` 繁体供 CBETA 对照。

```bash
npm run corpus:t2s          # 从 原文/ 生成 简体/
npm run corpus:simplify     # 目录名、meta、白话/注释 MD
npm run corpus:import       # 优先读 简体/，否则 t2s(原文/)
npm run fts:rebuild
npm run data:health         # 含繁体抽样；--strict 时异常>0 则失败
```

旧库若段落仍为繁体：`npm run db:convert-text` 后再 `corpus:import` 与 `fts:rebuild`。

### 导入后建议

```bash
npm run corpus:stats    # 查看经部、段落统计
npm run fts:rebuild     # 重建全文检索（写入 data/jingxin-search.db）
```

### 数据库瘦身（正文外置 + 检索分库）

主库 `jingxin.db` 不再存储 `paragraph.text`；正文从 `chinese-sutras-md/简体/` 按需读取；`paragraph_fts` 在 `jingxin-search.db`。

**已有 5GB 级旧库迁移：**

```bash
npm run db:stats              # 迁移前后体积对比
npm run db:migrate:slim       # 备份 → 去 text 列 → 删主库 FTS → VACUUM
npm run fts:rebuild           # 从语料 MD 重建检索库索引
npm run data:health --strict  # 含 jingxin-search.db 检查
```

**新环境：**

```bash
npm run db:migrate            # 瘦身体 paragraph + 空检索库
npm run corpus:import
```

部署必须设置 `CORPUS_DIR` 指向语料根目录，否则阅读页无正文。详见 `docs/superpowers/specs/2026-06-04-db-slim-corpus-fts-split-design.md`。

---


## 语料维护脚本

### 统计与审计

| 命令 | 用途 |
|------|------|
| `corpus:stats` | 经目/段落/部类统计 |
| `corpus:audit-category` | 部类一致性审计 |
| `corpus:audit-dir-jianti` | 目录简体审计 |
| `corpus:audit-bulei` | 部类目录审计 |
| `corpus:audit-xinbian` | 新编相关审计 |

### 结构与元数据迁移

| 命令 | 用途 |
|------|------|
| `corpus:migrate-dept` | 部类字段迁移 |
| `corpus:migrate-nest` | 目录嵌套迁移 |
| `corpus:migrate-dir-zh` | 目录中文名 |
| `corpus:backfill-bulei` | 补全部类 meta |
| `corpus:build-bulei-aliases` | 部类别名 JSON |

### 文本处理

| 命令 | 用途 |
|------|------|
| `corpus:simplify` | 语料简体化流程 |
| `corpus:t2s` | 繁转简 |
| `corpus:restore-yuanwen` | 恢复原文相关 |
| `corpus:merge-orphans` | 合并孤儿目录 |
| `corpus:pinyin` | 批量拼音标注 |
| `db:convert-text` | 库内段落文本转换 |

---

## 白话层

部分经目含 `colloquial` 字段（白话译文），阅读页可切换「白话/原文」，搜索 facet 可筛「仅有白话」。

**前提：** 语料目录下 `白话/全文.md` 须有非空段落内容，再执行 `corpus:import`。全藏 MD 生成时白话区块可能为空模板——此时阅读器不显示白话按钮，搜索侧栏也不显示「仅有白话」筛选。

检查白话是否入库：

```bash
npm run data:health   # 查看「含白话经目」计数
```

白话数据随语料导入进入 `paragraph` 表；批量生成流程见 `docs/superpowers/specs/` 语料设计文档。

---

## 全文检索（FTS）

统一搜索 `/search` 依赖 SQLite FTS。语料大批量变更后务必：

```bash
npm run fts:rebuild
```

---

## 专题与今日经句

```bash
npm run seed:topics      # 专题 intro + 经目关联
npm run seed:daily       # 初始今日经句
npm run daily:refresh    # 按策略刷新经句
```

---

## 验收清单

导入完成后在浏览器验证：

- [ ] `/canon` 显示部类与经目
- [ ] `/search?q=空` 有段落/经目结果
- [ ] `/sutra/xinjing`（或任意已导入 slug）可阅读
- [ ] 首页统计条数字合理

---

## 相关文档

- [01 本地开发](./01-local-setup.md)
- [03 辞典与图谱](./03-dictionary-and-kg.md)
- 仓库根 [README.md](../../README.md)

[← 返回管理员索引](./README.md)
