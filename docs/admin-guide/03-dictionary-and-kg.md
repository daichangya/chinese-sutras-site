# 03 · 辞典与图谱

---

## 佛学辞典

### 导入流程（典型）

```bash
# 1. 从 DILA 下载并解析 TEI（默认汉传核心源）
npm run dict:import:dila

# 或导入全部中文释义 DILA 源
npm run dict:import:all-han

# 2. 写入 SQLite
npm run dict:import:sqlite

# 3. 统计
npm run dict:stats
```

### 主要来源

| 代码 | 名称 | 说明 |
|------|------|------|
| dingfubao | 丁福保佛学大辞典 | 默认导入 |
| nanshanlu | 南山律学辞典 | 默认导入 |
| nti | NTI 汉英佛学辞典 | 默认导入（需先 `dict:import:dila --source nti` 或 TSV 管线） |
| soothill | 中英佛学辞典 | 可选，释义为英文 |
| foguang | 佛光大辭典 | 本地 MDict（`.mdx` + `.mdd`），见下方 |
| dila | 其他 DILA 源 | 视配置而定 |

### 佛光大辭典（MDict，阶段 A：仅语料 JSONL）

源文件置于项目根 `佛光大辭典/`（已 gitignore），需合法取得增订版 MDX/MDD。

```bash
# 依赖 mdict-utils。在 conda tools 等环境中：
#   pip install mdict-utils
# 若 python3 指向 Homebrew 而包装在 conda，请 conda activate tools 或设置：
#   DICT_MDICT_PYTHON=$CONDA_PREFIX/bin/python npm run dict:import:mdict

npm run dict:import:mdict
npm run dict:stats        # 应含 foguang ~32134 条
```

输出：`chinese-sutras-md/辞典/sources/佛光大辞典/entries.jsonl` 与 `assets/FGDCDZDB/*.jpg`。

### 佛光大辭典（阶段 B：SQLite + 辞典页）

```bash
npm run dict:import:mdict      # 阶段 A：JSONL + assets
npm run dict:import:sqlite     # 写入 SQLite FTS（含 foguang）
npm run dict:stats
```

- 插图通过 `GET /api/dictionary/assets/foguang/FGDCDZDB/{file}.jpg` 从语料目录读取（不复制到 `public/`）
- 辞典页 `/dictionary` 对 foguang 渲染 `definition_html`（富文本 + 内链 + 插图）
- 阅读器理解面板仍使用纯文本 `definition` 摘要

源定义见 `lib/dictionaries/sources.ts`。

### 搜索行为

- 主路径：headword 两阶段匹配（精确 > 前缀 > 子串），对齐 fojin
- 分组 API：`GET /api/dictionary/lookup/grouped?q=般若&size=10`
- 详见 `docs/superpowers/specs/2026-06-04-dictionary-search-parity-design.md`

### 用户面验收

- [ ] `/dictionary?q=般若` 精确词条在各辞典组内排第一
- [ ] `/dictionary?q=菩提` 按来源分组展示（含佛光大辭典，需已 import:sqlite）
- [ ] `/dictionary?q=䞋&source=foguang` 富文本释义与插图可加载
- [ ] `/search?q=菩提` 辞典分区有多来源代表条目
- [ ] 阅读页划选 → 辞典 Tab 有条目（纯文本摘要，来源显示中文名）

---

## 知识图谱

### 推荐流水线

```bash
# 1. 导入 DILA RDF 基础数据
npm run kg:import:dila
npm run kg:import:dila:place

# 2. 从语料抽取文本关系（可选）
npm run kg:extract:corpus
npm run kg:extract:cbeta-notes

# 3. 合并
npm run kg:merge

# 4. 写入 SQLite
npm run kg:import:sqlite
```

### 用户面验收

- [ ] `/kg` 显示 SVG 子图
- [ ] 点击人物节点可刷新子图
- [ ] `/person/[id]` 有人物属性与相关经目
- [ ] 阅读页译者卡片可链至人物（需 `kg:import:sqlite` 与 CBETA 映射）
- [ ] `/search` 人物分区有结果

API：`/api/kg/graph`、`/api/kg/person`。

---

## 佛教地理

地理点位来自 DILA `place.rdf`（`npm run kg:import:dila:place`），实体 `properties` 须含 `lat`/`lng`，再 `npm run kg:import:sqlite` 写入库。

**FoJin 对齐 enrichment（可选）：**

| 命令 | 说明 |
|------|------|
| `npm run kg:enrich:person-geo` | 从 Wikidata 为 DILA 人物匹配坐标（`geo_source: wikidata:Q…`） |
| `npm run kg:enrich:amap-monasteries -- --file=data/amap_temples_v3.json` | 导入高德寺院 POI JSON（需自备数据文件，勿提交 API key） |
| `npm run kg:enrich:geo` | 在 `知识图谱/geo/` 生成 GeoJSON 快照 |

若 `npm run data:health` 显示「地理实体」为 0，说明尚未执行地名导入或 SQLite 未刷新。

完成后刷新 `/places`，应看到全宽 Deck.GL 地图、类型筛选、搜索 fly-to 与统计 badge。

### 用户面验收

- [ ] `/places` 非空态（有 DILA 导入时约 1.9 万+ 地点）
- [ ] 统计 badge 显示标注数量 > 0
- [ ] 搜索地名后地图 fly-to 并弹出详情
- [ ] `?focus=` 深链可定位实体

---

## `logs/import-errors.jsonl` 与人物同名

`npm run kg:merge` 会检测 DILA 中 **同名不同人**（如两个「玄奘」：`A000294` 三藏、`A009306` 荆州僧人）。这是权威库的正常现象，**不是导入失败**，也不会删除实体。

| 文件 | 含义 |
|------|------|
| `logs/name-collisions.jsonl` | 每次 merge **覆盖**写入的同名审计（推荐查看） |
| `logs/import-errors.jsonl` | 仅记录真实导入异常；旧版 merge 曾把同名写入此文件，可删除后重跑 merge |

**无需「修复」数据。** 应用层按 **DILA ID** 区分人物；按名称搜索时：

- 图谱 `/kg`：`resolveKgCenterId` 优先关联边最多的实体（三藏玄奘 90 条关系）
- 译者匹配：`authoritativeIndex` 按 jsonl 顺序取首个 DILA 记录（`A000294` 在 `A009306` 之前）

若需消歧，应使用 `/person/kg:person:dila:A000294` 或展示同名列表，不要合并删除异名实体。

---

## 故障排查

| 现象 | 检查 |
|------|------|
| 辞典全空 | `dict:import:sqlite` 是否成功；`dict:stats` 词条数 |
| 搜索无辞典 | FTS 与辞典表是否分离；直接测 `/api/dictionary/lookup` |
| 图谱空 | `kg:import:sqlite`；`npm run data:health`；`/api/kg/graph` |
| 人物页 404 | ID 格式是否与库内一致 |
| 地理空 | `data:health` 地理实体计数；place 实体源尚未导入时属预期 |
| 白话筛选不显示 | `data:health` 含白话经目为 0；需写入 白话/全文.md 后 import |

---

## 相关文档

- [02 语料流水线](./02-corpus-pipeline.md)
- [读者手册 · 辞典](../user-guide/04-dictionary.md)
- [读者手册 · 图谱](../user-guide/06-kg-and-places.md)
- 设计规格：`docs/superpowers/specs/2026-06-03-buddhist-dict-kg-design.md`

[← 返回管理员索引](./README.md)
