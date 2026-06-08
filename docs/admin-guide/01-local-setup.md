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
| `AI_GATEWAY_URL` | OpenAI 兼容 Chat Completions 端点 |
| `AI_GATEWAY_API_KEY` | API 密钥 |
| `AI_MODEL` | 模型名称 |
| `CBETA_XML_DIR` | 从 XML 生成语料时使用 |

未配置 AI 时，阅读解释与 Chat 功能不可用，其余功能正常。

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
