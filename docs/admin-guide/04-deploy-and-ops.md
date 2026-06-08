# 04 · 部署与运维

---

## 概述

静心为 Next.js 应用 + 本地 SQLite，适合单机 VPS 部署。完整逐步说明见：

**[docs/deploy/vps.md](../deploy/vps.md)**

本章为精简 checklist 与运维要点，避免与 VPS 文档重复维护。

---

## 生产部署 checklist

### 1. 服务器准备

- Ubuntu 22.04+ / Debian 12+
- Node.js 22 LTS
- pm2、Caddy 或 Nginx

### 2. 数据目录

```bash
sudo mkdir -p /var/lib/jingxin /var/backups/jingxin
export DATA_DIR=/var/lib/jingxin
```

### 3. 代码与语料

```bash
git clone <jingxin-repo> && cd jingxin
git clone git@github.com:daichangya/chinese-sutras-md.git chinese-sutras-md
npm ci
```

### 4. 首次数据

```bash
npm run db:migrate
npm run corpus:import
npm run seed:topics
npm run seed:daily
# 可选：辞典与图谱
npm run dict:import:dila && npm run dict:import:sqlite
npm run kg:import:dila && npm run kg:import:dila:place && npm run kg:merge && npm run kg:import:sqlite
npm run kg:enrich:geo
npm run fts:rebuild
```

### 5. 环境变量

在生产环境配置 `.env` 或 pm2 ecosystem：

- `DATA_DIR=/var/lib/jingxin`
- `AI_GATEWAY_URL`、`AI_GATEWAY_API_KEY`、`AI_MODEL`

### 6. 构建与启动

```bash
npm run build
DATA_DIR=/var/lib/jingxin pm2 start npm --name jingxin -- start
```

`next.config` 已启用 `output: "standalone"`，也可使用 `.next/standalone` 目录运行 `node server.js`。

### 7. 反向代理

Caddy 示例（详见 vps.md）：

```caddy
jingxin.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

---

## SQLite 备份

建议 cron 定期备份 `DATA_DIR` 下数据库文件到 `/var/backups/jingxin`，保留多版本。具体命令见 [vps.md](../deploy/vps.md)。

---

## 双模式部署对照

| 项目 | 默认（本地 / 高配 VPS） | `JX_LOW_MEMORY=1`（2G VPS） |
|------|------------------------|----------------------------|
| 主库 `jingxin.db` | 含 `paragraph.text`（~1.6GB） | slim，仅身份列（~500MB） |
| 阅读正文 | DB 直读 | `CORPUS_DIR` 语料 MD hydrate |
| 启动预热 | 主库 + 检索库 | 仅主库；检索库懒加载 |
| SQLite 页缓存 | 默认 | 32MB（`JX_SQLITE_CACHE_MB` 可改） |
| 语料内存缓存 | 无上限 | LRU，默认 3 部经 |
| 数据准备 | `db:backfill-text`、`fts:rebuild` | `db:migrate:slim`；检索库从构建机 rsync |
| VPS 禁止 | — | `db:backfill-text`、`corpus:import`、`fts:rebuild` |

详见 [vps.md § 2G 低内存部署](../deploy/vps.md#2g-低内存部署jx_low_memory1)。

---

## 发布后验证

```bash
npm run verify    # 在 CI 或发布前：build + test + e2e:mock
```

生产环境人工抽检：

- [ ] 首页加载、搜索、阅读一页经
- [ ] AI Chat 能回复（若已配置 Gateway）
- [ ] `/dictionary`、`/kg`、`/places` 非空（若已导入）

---

## 更新流程

1. `git pull` 获取新版本
2. `npm ci`
3. `npm run db:migrate`（若有 schema 变更）
4. 按需重跑 `corpus:import` / `fts:rebuild` / 辞典图谱脚本
5. `npm run build`
6. `pm2 restart jingxin`

---

## 监控建议

- pm2 日志与进程状态
- 磁盘空间（语料 + SQLite 增长）
- AI Gateway 配额与错误率

---

## 相关文档

- [docs/deploy/vps.md](../deploy/vps.md) — 详细部署
- [01 本地开发](./01-local-setup.md)
- [02 语料流水线](./02-corpus-pipeline.md)
- [03 辞典与图谱](./03-dictionary-and-kg.md)

[← 返回管理员索引](./README.md)
