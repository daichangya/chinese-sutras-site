# jingxin 单机 VPS 部署

## 环境

- Ubuntu 22.04+ / Debian 12+
- Node.js 22 LTS
- pm2、Caddy 或 Nginx

## 目录

```bash
sudo mkdir -p /var/lib/jingxin /var/backups/jingxin
export DATA_DIR=/var/lib/jingxin
```

## 首次数据

语料库 `chinese-sutras-md/` 为独立 Git 仓库，克隆 jingxin 后需单独拉取：

```bash
git clone git@github.com:daichangya/chinese-sutras-md.git chinese-sutras-md
```

VPS **无需**克隆 `vendor/xml-p5`：

```bash
npm run db:migrate
npm run corpus:import
npm run seed:topics
npm run seed:daily
```

若需从 CBETA XML 重新生成语料（开发机）：

```bash
git clone --depth 1 https://github.com/cbeta-org/xml-p5.git vendor/xml-p5
CBETA_XML_DIR=./vendor/xml-p5 npm run corpus:gen
npm run corpus:import
```

## 构建与运行

```bash
npm ci
npm run build
DATA_DIR=/var/lib/jingxin pm2 start npm --name jingxin -- start
```

`next.config.ts` 已设置 `output: "standalone"`，也可使用 `.next/standalone` 目录直接运行 node server.js。

## Caddy 反代示例

```caddy
jingxin.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

## SQLite 备份（cron）

```cron
0 3 * * * sqlite3 /var/lib/jingxin/jingxin.db ".backup /var/backups/jingxin/jingxin-$(date +\%F).db"
```

保留 7 天备份后自行清理旧文件。

## 环境变量

见项目根目录 `.env.example`：`DATA_DIR`、`CORPUS_DIR`、`AI_GATEWAY_URL`、`AI_GATEWAY_API_KEY`、`AI_MODEL`。

---

## 2G 低内存部署（`JX_LOW_MEMORY=1`）

适用于 2GB RAM VPS。主库去掉 `paragraph.text`（~500MB），阅读正文从语料 MD 按需加载；检索库仍在磁盘，首次搜索才打开。

### 准备 swap（建议 2–4GB）

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 目录与语料

```bash
sudo mkdir -p /var/lib/jingxin
export DATA_DIR=/var/lib/jingxin
export CORPUS_DIR=/var/lib/jingxin/chinese-sutras-md
# rsync 或 git clone chinese-sutras-md 到 CORPUS_DIR
```

### 一次性数据（勿在 VPS 上跑 backfill-text / fts:rebuild / corpus:import）

在本地构建机生成 `jingxin-search.db` 后 rsync 到 VPS：

```bash
export JX_LOW_MEMORY=1
export DATA_DIR=/var/lib/jingxin
export CORPUS_DIR=/var/lib/jingxin/chinese-sutras-md

npm run db:migrate:slim
npm run data:health -- --strict
```

### pm2 示例

```js
module.exports = {
  apps: [{
    name: "jingxin",
    script: "npm",
    args: "start",
    instances: 1,
    env: {
      JX_LOW_MEMORY: "1",
      DATA_DIR: "/var/lib/jingxin",
      CORPUS_DIR: "/var/lib/jingxin/chinese-sutras-md",
      NODE_OPTIONS: "--max-old-space-size=512",
    },
  }],
};
```

### 性能预期

| 场景 | 全性能模式 | 低内存模式 |
|------|-----------|------------|
| 阅读首访（未缓存经） | ~800 ms | 2–5 s |
| 阅读复访同经 | 快 | 快（LRU 命中） |
| 搜索 | ~1–6 s | 相当（首次打开检索库略慢） |
| 磁盘 | data ~4.2G | data ~4.2G + 语料 ~4.4G ≈ 9G |

### 手动验收清单

```bash
JX_LOW_MEMORY=1 CORPUS_DIR=./chinese-sutras-md npm run data:health -- --strict
JX_LOW_MEMORY=1 CORPUS_DIR=./chinese-sutras-md npm start
```

- [ ] 访问 `/sutra/t08n0235`（或任意 MVP 经）能显示正文
- [ ] 连续打开 4 部经后 RSS 不持续增长（LRU 生效）
- [ ] 访问 `/search?q=金刚经` 能返回结果（首次略慢）
- [ ] 首页 `/` 正常加载（`daily_verse.snippet_text` 不触发全文加载）
