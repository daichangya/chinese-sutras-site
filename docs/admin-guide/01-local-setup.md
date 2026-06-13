# 01 · 本地开发

---

## 环境要求

- **Node.js** 22 LTS（推荐）
- **npm**（随 Node 安装）
- **Git**
- 磁盘空间：语料 + SQLite 视导入规模而定（全藏可达数 GB）

---

## 获取代码与语料子仓库

```bash
git clone <jingxin-repo>
cd jingxin
npm install
```

语料库为独立仓库，需单独克隆：

```bash
git clone git@github.com:daichangya/chinese-sutras-md.git chinese-sutras-md
```

---

## 最小启动（推荐路径）

```bash
npm run db:migrate
npm run corpus:import
npm run seed:topics
npm run seed:daily
npm run dev
```

浏览器打开 `http://localhost:3000`。

### 各步说明

| 命令 | 作用 |
|------|------|
| `db:migrate` | 创建/升级 SQLite 表结构 |
| `corpus:import` | 从 `chinese-sutras-md` 导入经目与段落 |
| `seed:topics` | 写入专题页种子（空性等） |
| `seed:daily` | 写入今日经句种子 |
| `dev` | 启动 Next.js 开发服务器 |

若只需快速演示、无需完整语料：

```bash
npm run db:migrate
npm run seed:demo
npm run dev
```

---

## 环境变量

复制 `.env.example` 为 `.env.local` 并按需修改：

```bash
DATA_DIR=./data
AI_GATEWAY_URL=https://your-gateway/v1/chat/completions
AI_GATEWAY_API_KEY=
AI_MODEL=deepseek-chat
CBETA_XML_DIR=./vendor/xml-p5
```

| 变量 | 说明 |
|------|------|
| `DATA_DIR` | SQLite 与数据文件目录，默认 `./data` |
| `jingxin.db` | 语料 / 辞典 / 图谱等业务主库（`db:migrate` 创建） |
| `jingxin-auth.db` | 账号与会话独立库（用户 / OAuth / Session，便于单独备份与管理） |
| `jingxin-search.db` | 段落 FTS 检索库 |
| `AI_GATEWAY_URL` | OpenAI 兼容 Chat Completions 端点 |
| `AI_GATEWAY_API_KEY` | API 密钥 |
| `AI_MODEL` | 模型名称 |
| `CBETA_XML_DIR` | 从 XML 生成语料时使用 |

站点用户可见名称可在 [`lib/site-config.ts`](../../lib/site-config.ts) 修改默认值，或通过 `SITE_BRAND_NAME`、`SITE_BRAND_TAGLINE` 等环境变量覆盖（见 `.env.example`）。

未配置 AI 时，阅读解释与 Chat 功能不可用，其余功能正常。

### 微信登录（可选，默认关闭）

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_WECHAT_LOGIN_ENABLED` | 设为 `1` 才显示登录入口并开放 OAuth（默认未设置=关闭） |
| `NEXT_PUBLIC_SITE_URL` | 站点公网 URL（OAuth 回调、Cookie） |
| `AUTH_SESSION_SECRET` | Session 签名密钥（生产必填，32+ 字节随机串） |
| `AUTH_SESSION_TTL_DAYS` | 会话有效期（天），默认 30 |
| `WECHAT_OPEN_APP_ID` / `SECRET` | [微信开放平台](https://open.weixin.qq.com) 网站应用（PC 扫码） |
| `WECHAT_MP_APP_ID` / `SECRET` | [微信公众平台](https://mp.weixin.qq.com) 服务号（微信内网页授权） |
| `NEXT_PUBLIC_WECHAT_OPEN_APP_ID` | 与开放平台 AppID 相同，供登录页 QR 组件 |
| `AUTH_MOCK_WECHAT=1` | 开发环境启用 `/api/auth/wechat/mock` 模拟登录 |

开放平台与公众号需绑定同一主体以获取 **UnionID**。本地开发可设 `AUTH_MOCK_WECHAT=1` 跳过真实微信。

---

## 从 CBETA XML 生成语料（开发机可选）

VPS 通常 **不需要** 此步骤，直接使用 `chinese-sutras-md` 即可。

```bash
git clone --depth 1 https://github.com/cbeta-org/xml-p5.git vendor/xml-p5
npm run corpus:gen
npm run corpus:import
```

---

## 测试

```bash
npm test              # 单元测试
npm run build         # 生产构建
npm run e2e:mock      # E2E（Mock AI，无需真实 Gateway）
npm run verify        # build + test + e2e:mock
```

完整 E2E（含真实页面与数据）：

```bash
npm run build
npm run e2e
```

---

## 下一步

- [02 语料流水线](./02-corpus-pipeline.md)
- [03 辞典与图谱](./03-dictionary-and-kg.md)
- [04 部署与运维](./04-deploy-and-ops.md)

[← 返回管理员索引](./README.md)
