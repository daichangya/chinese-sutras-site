# 白话译文人工校对清单

白话以 **Markdown 语料**为真相源，编辑 `chinese-sutras-md/{部类}/{经名}/白話/` 卷文件后入库。

## 流程

1. `npm run colloquial:batch`（或 `AI_MOCK=1 npm run colloquial:batch` 本地占位）
2. `npm run colloquial:check` — 查看各经 tier 覆盖率
3. 人工编辑语料 `## 白话` 区块
4. `npm run corpus:import`
5. `npm test` — 含 `tests/corpus/colloquial-coverage.test.ts`

## 分层目标（五期）

| Tier | 经目 | 生成范围 | 门禁 |
|------|------|----------|------|
| core | xinjing, jingangjing | 全部段落 | ≥80% |
| intro | amituojing, dizangjing, liuzutanjing, weimojiejing, guanwuliangshoujing, wuliangshoujing | 每经前 50 段 | ≥70% |
| long | fahuajing, liangyanjing, zhonglun | chapter_seq=0 前 50 段 | ≥70% |

## 校对状态

七期已用 `AI_MOCK=1 npm run corpus:refresh` 批量写入 tier 范围白话草稿；**人工校对**仍待完成。

- [x] 心经（xinjing）— core，AI 草稿 + demo 校对
- [ ] 金刚经（jingangjing）— core，AI 草稿已生成
- [ ] 阿弥陀经（amituojing）— intro，AI 草稿已生成
- [ ] 地藏经（dizangjing）— intro 前 50 段，AI 草稿已生成
- [ ] 六祖坛经（liuzutanjing）— intro 前 50 段，AI 草稿已生成
- [ ] 维摩诘经（weimojiejing）— intro 前 50 段，AI 草稿已生成
- [ ] 观无量寿经（guanwuliangshoujing）— intro，AI 草稿已生成
- [ ] 无量寿经（wuliangshoujing）— intro 前 50 段，AI 草稿已生成
- [ ] 法华经（fahuajing）— long 首卷 50 段，AI 草稿已生成
- [ ] 楞严经（liangyanjing）— long 首卷 50 段，AI 草稿已生成
- [ ] 中论（zhonglun）— long 首卷 50 段，AI 草稿已生成

## AI 辅助生成

```bash
AI_MOCK=1 npm run colloquial:batch    # 无 Gateway 时占位
npm run colloquial:generate -- --slug xinjing --resume
npm run corpus:import
```

生成前需配置 `AI_GATEWAY_URL` 等，见 `.env.example`。

## 从 CBETA 生成语料

```bash
git clone --depth 1 https://github.com/cbeta-org/xml-p5.git vendor/xml-p5
npm run corpus:gen
```

XML 默认路径：`vendor/xml-p5`（可用 `CBETA_XML_DIR` 覆盖）。
