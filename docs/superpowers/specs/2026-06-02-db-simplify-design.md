# 数据库精简缩减设计

**日期:** 2026-06-02
**目标:** 将 DB 从 3.6GB 缩减到 ~300MB，DB 只存简体，繁/拼音实时生成

---

## 现状诊断

| 表 | 行数 | 大小 | 问题 |
|---|---|---|---|
| paragraph | 2,543,405 | 1,812 MB | text 存繁体，text_simplified 全 NULL |
| paragraph_fts_data | 255,960 | 1,007 MB | FTS 索引繁体文本 |
| sutra | 4,991 | 0.8 MB | 有 title_simplified 字段 |
| chapter | 21,823 | 1.5 MB | OK |
| pinyin_cache | 0 | 0 | 空表（保留结构） |
| ai_explanation_cache | 0 | 0 | 空表 |

**核心问题:** DB 存繁体，`text_simplified` 全 NULL（0 行有值），网站显示简体但每次从繁体实时转换。方向反了。

## 方案设计

### 原则
1. DB `paragraph.text` 存简体中文
2. `text_simplified` 字段删除（text 本身就是简体，不需要冗余）
3. `pinyin_text` 字段删除（0 行有值，实时生成）
4. `sutra.title_simplified` 字段删除（title 本身存简体）
5. 需要繁体时实时 `s2t` 转换
6. 保留 `colloquial`, `commentary`, `lecture` 字段（将来导入白话数据）
7. 保留 `pinyin_cache` 表（将来使用）
8. 不删除任何 corpus markdown/XML 文件

### Schema 变更

**lib/db/schema.ts:**
- 删除 `sutra.titleSimplified` 字段
- 删除 `paragraph.textSimplified` 字段
- 删除 `paragraph.pinyinText` 字段
- 保留 `paragraph.colloquial`, `paragraph.commentary`, `paragraph.lecture`

**scripts/migrate.ts:**
- 新增检查：如果旧字段存在且全为 NULL，执行 DROP COLUMN 迁移

### 数据迁移

1. 将现有 `text`（繁体）转为简体，写回 `text`
2. 删除 FTS 虚拟表，重建为简体索引
3. 删除 `paragraph_fts_data` 中的繁体数据

### 搜索链路变更

**当前:** 简体搜索词 → `s2t` 转繁体 → 匹配 FTS（繁体）
**新的:** 搜索词 → `t2s` 转简体 → 匹配 FTS（简体）

**lib/search/fts.ts:**
- `s2t(trimmed)` → `t2s(trimmed)`
- FTS 索引简体文本后，搜索词转简体即可匹配

### 阅读页变更

**components/reader/reader-shell.tsx:**
- `p.text` 现在是简体，直接显示
- 将来如有繁体切换功能：`s2t(p.text)` 实时转换
- `colloquial` 保留（白话切换按钮仍然有效）

### 导入链路变更

**lib/corpus-v3/import-align.ts:**
- `ImportParagraph.text` 改为存简体（读取原文 MD 后 `t2s`）
- 删除 `textSimplified` 和 `pinyinText` 字段
- 保留 `colloquial`, `commentary`, `lecture`

**scripts/import-corpus.ts:**
- 更新 upsert 语句，移除 `text_simplified` 和 `pinyin_text`
- `withSimplified` 选项移除（text 本身就是简体）

**scripts/rebuild-fts.ts:**
- FTS 索引简体 `text`（不需要转换）

## 预期效果

| 项目 | 当前 | 预计 |
|---|---|---|
| paragraph 表 | ~1.8 GB | ~1.7 GB（简体字符 UTF-8 略紧凑）|
| FTS 索引 | ~1.0 GB | ~0.9 GB |
| text_simplified 列 | 全 NULL 浪费 | 删除 |
| pinyin_text 列 | 全 NULL 浪费 | 删除 |
| title_simplified 列 | 浪费 | 删除 |
| **总计** | **~3.6 GB** | **~2.6 GB** |

注意：实际节省不是特别大，因为 corpus 的 markdown 文件（简体/ 目录）仍然存在但 DB 不存它们。主要收益是：
1. 去除了冗余 NULL 列（schema 简洁）
2. 搜索性能提升（不需要先转换搜索词）
3. 存储结构与实际使用一致

## 实施步骤

1. 修改 schema.ts — 删除冗余字段
2. 修改 migrate.ts — 支持列删除迁移
3. 修改 import-align.ts — text 存简体
4. 修改 import-corpus.ts — 移除冗余字段
5. 修改 rebuild-fts.ts — 简体索引
6. 修改 search/fts.ts — 简体搜索
7. 修改 reader-shell.tsx — 简体直接显示
8. 执行数据库迁移脚本
9. 验证构建和测试
