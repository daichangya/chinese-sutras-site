## Why

汉文佛典的权威数字化已由 CBETA 等项目覆盖，但普通读者与初学者仍难以「读懂一句经」——检索门槛高、排版陈旧、缺少与现代生活连接的释义路径。jingxin（静心）要做的是**阅读与理解平台**：在 CBETA 底本之上，用无尽藏式阅读体验、段落级 AI 辅助和专题化知识结构，让佛经更容易读懂。

## What Changes

- 新建 Next.js 全栈应用（TypeScript），单仓部署于**单机 VPS + SQLite 文件**。
- 离线导入 CBETA TEI P5 XML，结构化存入 `sutra` / `chapter` / **`paragraph`**（系统中枢表）。
- SQLite FTS5 全文检索（不引入 Elasticsearch）。
- MVP 阅读器：夜间模式、字号/行距、阅读进度、原文/白话切换。
- MVP 差异化：划选段落 → AI 三栏解释（现代解释 / 历史背景 / 生活案例），经既有 AI Gateway。
- 首页：今日经句 + AI 短解读 + 热门经典 + 搜索。
- 第四周：收藏（经/段）、2 个专题页（空性/净土）、`tag` 经文关联（不用 Neo4j）。
- 明确**不做**（至少两年）：公开社区、评论、Redis、微服务、全藏首发。

## Capabilities

### New Capabilities

- `cbeta-corpus`: CBETA XML 导入、经元数据、段落存储、gaiji 与版权 attribution
- `scripture-reader`: 沉浸阅读 UI、排版偏好、进度、原文/白话层
- `scripture-search`: FTS5 全文搜索与结果展示
- `ai-explanation`: 划选解释、白话生成、缓存、Gateway 集成与免责
- `home-discovery`: 首页、今日经句、热门经目、分享页
- `topic-catalog`: 专题阅读（导读 + 经目列表 + tag 关联）
- `user-library`: 收藏（经/段）；第二版扩展笔记与高亮

### Modified Capabilities

（无既有 openspec specs）

## Impact

- 新建仓库应用代码、`scripts/import-cbeta.ts`、Drizzle schema、`data/jingxin.db`（VPS 持久卷）。
- 依赖外部：CBETA xml-p5 数据源、用户自有 AI Gateway（HTTP）。
- 运维：VPS 上 Node 进程 + SQLite 文件备份（cron/rsync）；HTTPS 由 Caddy/Nginx 终结。
