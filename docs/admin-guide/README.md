# 静心 · 管理员手册

本手册面向 **开发者与运维人员**，说明如何本地启动、导入语料与辞典/图谱数据、部署生产环境及排查常见问题。读者使用说明见 **[读者使用手册](../user-guide/README.md)**。

---

## 文档目录

| 章节 | 内容 |
|------|------|
| [01 本地开发](./01-local-setup.md) | 依赖、最小启动、环境变量 |
| [02 语料流水线](./02-corpus-pipeline.md) | 导入、FTS、白话/拼音/简繁 |
| [03 辞典与图谱](./03-dictionary-and-kg.md) | 辞典、KG、地理数据 |
| [04 部署与运维](./04-deploy-and-ops.md) | 生产部署、备份、验证 |

详细 VPS 步骤见 **[docs/deploy/vps.md](../deploy/vps.md)**。

---

## npm scripts 速查

### 数据库与种子

| 命令 | 用途 |
|------|------|
| `npm run db:migrate` | 执行 SQLite 迁移 |
| `npm run db:generate` | Drizzle 生成迁移文件 |
| `npm run seed:demo` | 演示用最小数据集 |
| `npm run seed:topics` | 专题页种子数据 |
| `npm run seed:daily` | 今日经句种子 |
| `npm run daily:refresh` | 刷新今日经句 |

### 语料

| 命令 | 用途 |
|------|------|
| `npm run corpus:import` | 从 `chinese-sutras-md` 入库 |
| `npm run corpus:gen` | 从 CBETA XML 生成语料（需 `vendor/xml-p5`） |
| `npm run corpus:stats` | 语料统计 |
| `npm run fts:rebuild` | 重建全文检索索引 |
| `npm run corpus:simplify` | 语料简繁处理 |
| `npm run corpus:t2s` | 繁转简 |
| `npm run corpus:pinyin` | 段落拼音标注 |
| `npm run corpus:migrate-dept` | 部类元数据迁移 |
| `npm run corpus:migrate-nest` | 目录嵌套迁移 |
| `npm run corpus:migrate-dir-zh` | 目录中文名迁移 |
| `npm run corpus:audit-*` | 各类语料审计 |
| `npm run corpus:backfill-bulei` | 补全部类元数据 |
| `npm run corpus:build-bulei-aliases` | 构建部类别名 |
| `npm run corpus:ensure-t05n0220-index` | 确保特定经索引 |

### 辞典

| 命令 | 用途 |
|------|------|
| `npm run dict:import:dila` | 从 DILA 导入默认汉传辞典 |
| `npm run dict:import:all-han` | 导入全部中文释义 DILA 源 |
| `npm run dict:import:sqlite` | 辞典写入 SQLite |
| `npm run dict:stats` | 辞典词条统计 |
| `npm run data:health` | SQLite 健康检查（语料/辞典/KG/白话）；加 `--strict` 用于 CI |

### 知识图谱与地理

| 命令 | 用途 |
|------|------|
| `npm run kg:import:dila` | 导入 DILA 人物 RDF |
| `npm run kg:import:dila:place` | 导入 DILA 地名 RDF（含经纬度） |
| `npm run kg:extract:corpus` | 从语料抽取关系 |
| `npm run kg:extract:cbeta-notes` | 从 CBETA 注疏抽取 |
| `npm run kg:merge` | 合并图谱数据 |
| `npm run kg:import:sqlite` | 图谱写入 SQLite |
| `npm run kg:enrich:geo` | 地理坐标 enrichment |

### 转换与字典构建

| 命令 | 用途 |
|------|------|
| `npm run opencc:build-dict` | 构建 OpenCC 字典 |
| `npm run pinyin:build-dict` | 构建拼音字典 |
| `npm run convert:t2s` / `convert:s2t` | 文本简繁转换 |
| `npm run convert:pinyin` | 文本注音 |
| `npm run db:convert-text` | 库内段落文本转换 |

### 测试与验证

| 命令 | 用途 |
|------|------|
| `npm test` | Vitest 单元测试 |
| `npm run build` | 生产构建 |
| `npm run e2e` | Playwright E2E（需 build + 数据） |
| `npm run e2e:mock` | Mock AI 的 E2E |
| `npm run verify` | build + test + e2e:mock |

---

## 数据目录

默认数据目录由环境变量 `DATA_DIR` 控制（见 `.env.example`）：

```bash
DATA_DIR=./data
```

SQLite 数据库与相关文件通常位于 `DATA_DIR` 下。生产环境建议使用独立磁盘路径，例如 `/var/lib/jingxin`。

---

## 故障排查

| 现象 | 可能原因 | 处理 |
|------|----------|------|
| 搜索无结果 | 未导入语料或 FTS 未重建 | `corpus:import` → `fts:rebuild` |
| 辞典为空 | 未导入辞典 | `dict:import:dila` → `dict:import:sqlite` |
| 图谱/地理为空 | 未导入 KG 或 geo | 见 [03 辞典与图谱](./03-dictionary-and-kg.md) |
| AI 无响应 | 未配置 Gateway | 设置 `AI_GATEWAY_URL` / `AI_GATEWAY_API_KEY` |
| 经藏页空 | 语料未入库 | 检查 `chinese-sutras-md` 与 `corpus:import` |
