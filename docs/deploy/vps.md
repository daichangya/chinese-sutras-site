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

见项目根目录 `.env.example`：`DATA_DIR`、`AI_GATEWAY_URL`、`AI_GATEWAY_API_KEY`、`AI_MODEL`。
