# 静心 jingxin

现代化佛经阅读与理解平台（Next.js + SQLite + CBETA）。

## 开发

```bash
npm install
git clone git@github.com:daichangya/chinese-sutras-md.git chinese-sutras-md
npm run db:migrate
npm run corpus:import          # 从 chinese-sutras-md/** + _index 入库（开发机可用 XML 校验）
# VPS：npm run corpus:import -- --md-only
# 或本地演示：npm run seed:demo

# 从 CBETA XML 重新生成语料（可选）
git clone --depth 1 https://github.com/cbeta-org/xml-p5.git vendor/xml-p5
npm run corpus:gen             # 默认读取 vendor/xml-p5

npm run seed:topics
npm run seed:daily
npm run dev
```

## 测试

```bash
npm test
npm run build
npm run e2e   # 需先 build + 有数据
```

## 部署

见 [docs/deploy/vps.md](docs/deploy/vps.md)。
