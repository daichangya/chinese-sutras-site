## Context

jingxin 仓库当前仅有 OpenSpec 脚手架，无应用代码。产品定位为佛经**阅读与理解**平台：CBETA 作权威底本，面向普通读者与初学者。用户已批准技术路线：**Next.js 全栈 + SQLite 文件 + Drizzle + FTS5 + 既有 AI Gateway**，部署在**单机 VPS**（非 Cloudflare D1 / 非 Elasticsearch / 非 Neo4j）。

## Goals / Non-Goals

**Goals:**

- 4 周内上线 MVP：12 部热门经、沉浸阅读、FTS 搜索、划选 AI 解释、今日经句、收藏与 2 个专题。
- `paragraph` 作为唯一内容中枢，支撑阅读、搜索、AI、收藏与未来 RAG。
- 零额外中间件运维：单 Node 进程 + 单 SQLite 文件 + 可脚本化备份。

**Non-Goals:**

- 全藏导入、公开社区、评论、微服务、Redis、Elasticsearch、Neo4j。
- 第二版的笔记/高亮、第三版的 AI 问经与学习计划在 MVP change 中仅预留 schema/接口，不实现。

## Decisions

### D1: 部署 — 单机 VPS + SQLite 文件（用户批准）

- **选择:** `better-sqlite3`，DB 路径 `process.env.DATA_DIR/jingxin.db`。
- **理由:** 零托管依赖、备份简单（`sqlite3 .backup`）、与开发环境一致。
- **备选已否决:** Cloudflare D1（边缘绑定复杂度）、Turso（多供应商）、PostgreSQL（运维过重）。

### D2: 应用形态 — Next.js 单仓全栈

- **选择:** App Router + Route Handlers；无独立 Java API。
- **理由:** SEO、阅读页 SSR、与 TypeScript 栈统一；团队规模适合单仓。

### D3: 搜索 — SQLite FTS5

- **选择:** `paragraph_fts` 虚拟表，查询封装在 `lib/search/fts.ts`。
- **理由:** 12～20 经 + 后续数百经规模下延迟可接受；避免 ES 集群。

### D4: 经文关联 — `tag` / `sutra_tag` 表

- **选择:** 运营配置标签边，阅读页展示「相关经典」列表。
- **理由:** 用户明确要求不用 Neo4j；MVP 图规模小。

### D5: AI — 外部 Gateway + DB 缓存

- **选择:** `lib/ai/gateway.ts` 调用 `AI_GATEWAY_URL`；`ai_explanation_cache` 表去重。
- **理由:** 模型可切换；不在本仓库维护 LLM 基础设施。
- **护栏:** 系统 prompt 禁止虚构出处；全站免责声明组件。

### D6: CBETA 导入 — 离线脚本，非运行时拉取

- **选择:** `scripts/import-cbeta.ts` 读本地 xml-p5 目录；CI/开发者手动执行。
- **理由:** 版权可控、可复现；生产只读 DB。

### D7: 收藏 MVP — localStorage 可选，schema 预留

- **选择:** W4 实现 `user_bookmark` 表；若无登录则 `localStorage` + 导出迁移路径文档化。
- **理由:** 降低 W4 认证 scope；表结构先定避免返工。

### D8: 进程与反向代理

- **选择:** `next build` + `output: 'standalone'`；pm2 运行；Nginx/Caddy 终结 TLS，反代 `127.0.0.1:3000`。
- **备份:** 每日 cron `sqlite3 $DATA_DIR/jingxin.db ".backup $BACKUP_DIR/jingxin-$(date +%F).db"`，保留 7 天。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| VPS 单点故障 | 监控 + 异地备份；后期只读副本 |
| SQLite 写并发 | MVP 读多写少；AI 缓存异步写；避免长事务 |
| AI 释经错误 | 缓存 + 免责 + 热门句人工校对 |
| CBETA gaiji 显示 | 补充字体 CSS + fallback 标记 |
| 磁盘占满 | MVP 仅 12 经；扩容前不导入全藏 |

## Migration Plan

1. VPS 安装 Node 22、pm2、Caddy。
2. 创建 `DATA_DIR`，首次运行 import 脚本生成 `jingxin.db`。
3. 部署 standalone 产物，环境变量注入 Gateway 与 `DATA_DIR`。
4. 回滚：保留上一版 build + 上一日 DB 备份文件。

## Open Questions

- AI Gateway 的具体 HTTP 契约（路径、请求体）需在实现前对照现有转发系统文档定稿。
- 登录方式（若 W4 要跨设备收藏）：魔法链接 vs 延后到第二版 — **当前默认 W4 仅 localStorage**。
