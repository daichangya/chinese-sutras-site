# 全藏 Markdown 生成 Implementation Plan

> **For agentic workers:** 按任务顺序实现；全量 `corpus:gen:full` 在本机跑，CI 仅 `--limit 3`。

**Goal:** 从 xml-p5 全部 XML 生成 `corpus-full/sutras/*.md`（空白话）+ `catalog.json`，不提交 git，不影响 MVP `corpus/sutras/`。

**Architecture:** `discover-xml` 收集路径 → 复用 CBETA parser + 分片序列化 → 按 `cbetaId` 小写 slug 写入 `corpus-full`；`catalog.json` 记录状态供 `--resume`。

**Tech Stack:** TypeScript, tsx, 现有 `lib/cbeta/parser`、`lib/corpus/serialize`。

---

## File map

| 文件 | 职责 |
|------|------|
| `lib/cbeta/discover-xml.ts` | 递归发现 XML、解析 cbetaId |
| `lib/cbeta/gen-markdown.ts` | 从 gen-cbeta-markdown 抽取单经生成逻辑 |
| `scripts/gen-cbeta-markdown.ts` | 改为调用 gen-markdown（MVP 行为不变） |
| `scripts/gen-full-corpus.ts` | 全藏批处理 + catalog + errors |
| `lib/corpus/full-catalog.ts` | catalog 读写类型 |
| `tests/cbeta/discover-xml.test.ts` | 发现逻辑单测 |
| `tests/corpus/gen-full-smoke.test.ts` | `--limit 1` 烟雾（可选 execSync） |

---

### Task 1: discover-xml

**Files:**
- Create: `lib/cbeta/discover-xml.ts`
- Test: `tests/cbeta/discover-xml.test.ts`

- [ ] 实现 `discoverCbetaXmlFiles(xmlRoot): { cbetaId, absolutePath }[]`
- [ ] 文件名须匹配 `^[A-Z]+\d+n\d+[A-Za-z]?\.xml$`（与 resolve-path 一致）
- [ ] 单测：fixture 或 mock 目录至少 1 条

---

### Task 2: 抽取共享生成逻辑

**Files:**
- Create: `lib/cbeta/gen-markdown.ts`
- Modify: `scripts/gen-cbeta-markdown.ts`

- [ ] 抽出 `generateSutraMarkdownFiles(entry, xmlPath, options)` 返回 `writtenPaths[]`
- [ ] MVP 脚本行为与现有一致（11 经、preserve colloquial、clean-stale）
- [ ] `npm test` 仍绿

---

### Task 3: catalog 与 gen-full-corpus

**Files:**
- Create: `lib/corpus/full-catalog.ts`
- Create: `scripts/gen-full-corpus.ts`
- Modify: `package.json` → `"corpus:gen:full": "tsx scripts/gen-full-corpus.ts"`

- [ ] `catalog.json` 结构：`version`, `generatedAt`, `entries[]`
- [ ] 每经：`cbetaId`, `slug`, `title`, `status`, `files`, `paragraphCount`, `error?`
- [ ] CLI：`--limit`, `--resume`, `--slug`, `--clean-stale`
- [ ] 空白话：`serializeCorpusMarkdown` 不写 colloquial 或写空块（与 spec 一致）
- [ ] 进度日志每 50 部；`logs/gen-errors.jsonl`

---

### Task 4: gitignore 与文档

**Files:**
- Modify: `.gitignore`（已完成可核对）
- Create: `corpus-full/README.md`（已完成可核对）

- [ ] 确认 `corpus-full/README.md` 可提交、`sutras/` 被 ignore

---

### Task 5: 烟雾测试

**Files:**
- Create: `tests/corpus/gen-full-smoke.test.ts`

- [ ] 若存在 `vendor/xml-p5` 或 fixture：`gen-full --limit 1` 产出 1 个 catalog entry
- [ ] 无 XML 时 skip（与 parser.test 一致）

---

### Task 6: 本机全量生成（人工）

- [ ] `npm run corpus:gen:full -- --clean-stale`
- [ ] 检查 `catalog.json`：`ok` 数量 ~5000
- [ ] 磁盘空间充足；不 `git add corpus-full/sutras`

---

## 验收

- `npm test` + `npm run build` 通过
- `corpus:gen:full --limit 3` 本地可重复
- MVP `corpus:refresh` 不受影响
