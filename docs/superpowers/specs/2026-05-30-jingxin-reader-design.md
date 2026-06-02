# jingxin（静心）— 佛经阅读与理解平台 · 设计规格

**版本:** 1.0  
**日期:** 2026-05-30  
**状态:** 已批准（部署：单机 VPS + SQLite 文件）

---

## 1. 产品定位

**一句话：** 现代化的佛经阅读与理解平台，而不是佛经数据库。

**Slogan：** 让佛经更容易读懂（副标：从阅读佛经，到理解佛法）

**长期价值：**

```text
权威佛典（CBETA）
+ 现代阅读体验（无尽藏 / Medium）
+ AI 辅助理解（大藏经 AI 模式，经 Gateway）
+ 专题化知识体系（地藏信仰式专题）
```

**不做（至少两年）：** 公开社区、评论、Neo4j、Elasticsearch、Redis、微服务。

| 参考站 | 借鉴 | 不借鉴 |
|--------|------|--------|
| CBETA | 经号、TEI 段落、版权 | 门户 UI |
| 无尽藏 | 排版、留白、沉浸阅读 | 首发 2 万卷 |
| 大藏经 AI | 白话层、段落 AI、经目信息 | 整站克隆 |
| 地藏信仰 | 专题深度 | 单一菩萨站局限 |
| 经文网 | 首页热门经、低门槛 | 陈旧视觉 |

---

## 2. 目标用户

1. **普通人**（焦虑、失眠、迷茫）— 今日经句 + 短 AI 解读 + 分享。
2. **初学者** — 原文/白话切换 + 划选解释。
3. **爱好者** — FTS 检索、收藏；第二版笔记/高亮。

非法师、非纯学术研究者。

**MVP 成功标准：**

- 30 秒内：首页 → 《心经》→ 划选 → 看到 AI 解释。
- 搜索「空」：P95 &lt; 1s（12～20 经规模）。
- 今日经句页具备可分享 OG 元数据。

---

## 3. 功能分期

### 3.1 第一版 MVP（约 4 周）

| ID | 功能 | 要点 |
|----|------|------|
| F1 | 经文阅读 | 夜间/字号/行距/进度；无尽藏式主栏 |
| F2 | 原文/白话切换 | `paragraph.colloquial`；热门经优先人工校对 |
| F3 | 段落 AI 解释 | 划选 → 现代解释 \| 历史背景 \| 生活案例 |
| F4 | 全文搜索 | SQLite FTS5 |
| F5 | 今日经句 | 首页 + `/verse/today` + AI 解读 + 分享 |

**MVP 经目（12 部）：** 心经、金刚经、地藏经、阿弥陀经、普门品、法华经（选卷）、楞严经（选卷）、六祖坛经、维摩诘经（选）、中论（选）、无量寿经、观无量寿经。

### 3.2 第二版

- 专题：空性、净土、禅宗（模板化 `topic` + `topic_item`）
- `tag` / `sutra_tag` 经文关联
- 收藏经/段；阅读笔记（高亮、批注）

### 3.3 第三版

- AI 问经（FTS 召回 + Gateway + 段落引用）
- AI 学佛路径推荐
- 学习计划（如 21 天心经）

---

## 4. 部署架构（已批准：方案 C）

**选型：单机 VPS + SQLite 文件**

```text
Internet → Nginx/Caddy (HTTPS)
              ↓
         Node.js (next start 或 pm2)
              ↓
         data/jingxin.db  (持久卷，每日备份)
```

| 项 | 决策 |
|----|------|
| 运行时 | Node 22 LTS，pm2 守护 |
| 数据库 | `better-sqlite3` + 文件路径 `DATA_DIR/jingxin.db` |
| 备份 | cron `sqlite3 .backup` 或 litestream → 对象存储 |
| 静态资源 | Next.js standalone 输出 |
| 不采用 | Cloudflare D1、Turso、Elasticsearch、Redis |

本地开发与生产使用同一套 SQLite 文件语义；生产 `DATA_DIR` 挂载 VPS 数据盘。

---

## 5. 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Next.js 15+ App Router、TypeScript |
| UI | Tailwind CSS、shadcn/ui |
| ORM | Drizzle ORM |
| DB | SQLite + FTS5 虚拟表 |
| AI | 既有 AI Gateway（`AI_GATEWAY_URL`、`AI_GATEWAY_API_KEY`、可选 `AI_MODEL`） |
| 测试 | Vitest（单元）、Playwright（E2E） |

**仓库结构：**

```text
jingxin/
├── app/                 # 页面与 Route Handlers
├── components/reader|search|home/
├── lib/db/              # Drizzle + 连接
├── lib/ai/gateway.ts
├── lib/cbeta/parser.ts
├── lib/search/fts.ts
├── scripts/import-cbeta.ts
├── drizzle/
├── data/                # .gitignore，含 jingxin.db
└── docs/superpowers/specs/
```

---

## 6. 数据模型

**导入管线：** CBETA XML (`vendor/xml-p5`) → `corpus:gen` → Markdown (`corpus/sutras/`) → `corpus:import` → SQLite → 重建 FTS5。详见 [2026-05-30-jingxin-corpus-design.md](2026-05-30-jingxin-corpus-design.md)。

| 表 | 说明 |
|----|------|
| `sutra` | `cbeta_id` UK、`slug`、`title`、`translator`、`category`、`char_count` |
| `chapter` | 分卷；小品经可单章 |
| **`paragraph`** | `id`、`sutra_id`、`chapter_seq`、`seq`、`text`、`colloquial` — **系统中枢** |
| `paragraph_fts` | FTS5：`paragraph_id, sutra_title, text` |
| `tag` / `sutra_tag` | 经文关联（无图数据库） |
| `topic` / `topic_item` | 专题（W4 起） |
| `daily_verse` | 运营经句 |
| `ai_explanation_cache` | 解释缓存键：selection+tab+modelVersion |
| `user_bookmark` | W4；可先 localStorage，表预留 |

---

## 7. 页面与 API

| 路由 | 说明 |
|------|------|
| `/` | 今日经句、搜索、热门经 |
| `/sutra/[slug]` | 阅读器（slug 映射 cbeta_id） |
| `/search?q=` | FTS 结果 |
| `/verse/today` | 分享落地页 |
| `/topic/[slug]` | W4 专题 |
| `POST /api/ai/explain` | 划选解释 |
| `POST /api/ai/daily` | 今日经句解读 |

**阅读页：**

- 主栏：经题、译者、原文\|白话、段落流。
- 顶栏：主题、字号 3 档、行距 3 档、进度条。
- 侧栏/抽屉：划选后三 Tab AI。

**错误处理：**

- AI 失败：侧栏友好提示，不阻塞阅读。
- gaiji：CBETA 补充字体 + `[缺字]` fallback。
- 搜索无结果：热门经 + 示例词。

---

## 8. AI 设计

**Gateway 封装** (`lib/ai/gateway.ts`)：

- 输入：选中文本、paragraphId、前后文、sutraTitle、tab 类型。
- 输出：`{ content, disclaimer }`。
- 先查 `ai_explanation_cache`，未命中再调 Gateway。

**Prompt 护栏：**

- 不得虚构经名与出处。
- `background` 无依据时明确说明。
- 全站免责：「AI 辅助理解，不能替代法师开示」。

**白话：** 批量脚本预生成 + 心经/金刚经前段人工校对。

---

## 9. 测试

| 层级 | 内容 |
|------|------|
| 单元 | TEI parser fixture `T08n0251.xml` |
| 集成 | FTS 匹配「观自在」；导入后段落数 |
| API | mock Gateway，断言 cache |
| E2E | 首页→心经→划选→侧栏→白话切换 |
| AI 黄金集 | 20 名句 JSON；禁止幻觉经名（nightly 可选） |

---

## 10. 四周节奏

| 周 | 交付 |
|----|------|
| W1 | Schema、import 12 经、FTS、首页骨架 |
| W2 | 阅读器、搜索 |
| W3 | 白话、划选 AI、今日经句+分享 |
| W4 | 收藏、专题×2、tag 关联、关于/CBETA 版权页 |

---

## 11. 风险

| 风险 | 缓解 |
|------|------|
| CBETA 授权 | 页脚 attribution；非商用说明 |
| AI 偏差 | 缓存、免责、热门句校对 |
| VPS 单点 | 备份 + 监控；后期可加只读副本 |
| 磁盘 | 全藏前仅 12～20 经；DB 预计 &lt; 500MB MVP |

---

## 12. 参考

- [CBETA](https://cbeta.org)
- [cbeta-org/xml-p5](https://github.com/cbeta-org/xml-p5)
- OpenSpec change: `openspec/changes/jingxin-mvp/`
