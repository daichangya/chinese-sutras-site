# 静心功能全面测试与修复 — 设计说明

**日期：** 2026-06-03  
**状态：** 已实施  
**作者：** jingxin

---

## 目标

对读者手册 16 项功能做系统化验收，修复阻塞性数据缺口与代码/UX 缺陷；对暂无源数据的能力（白话层、佛教地理）做优雅降级并文档化。

---

## 策略（B+C 混合）

| 类别 | 决策 |
|------|------|
| KG 关系 / 人物页 / 图谱 | **B** — 跑语料 KG 抽取并 import SQLite |
| 白话 / 平行对读白话 | **C** — 语料白话文件为空，隐藏误导 UI |
| 佛教地理 | **C** — 无 place 实体源，保留空态 + 文档 |
| Chat / 搜索 facet / 人物经目 | **代码修复** |

---

## 数据修复

### 执行命令

```bash
npm run kg:extract:corpus
npm run kg:merge
npm run kg:import:sqlite
npm run data:health -- --strict
```

**注意：** 不要单独重跑 `kg:import:dila`，其会覆盖 JSONL；当前人物种子已存在于 `entities.jsonl`，`kg:extract:corpus` 会 merge 追加 text/dynasty 与 translated 关系。

### 脚本层修复

`lib/db/index.ts` 引入 `server-only` 导致 CLI 脚本无法 `import @/lib/db`。拆出 [`lib/db/sqlite.ts`](../lib/db/sqlite.ts) 供脚本使用；Next.js 仍通过 `lib/db/index.ts` 导出。

### 健康检查

[`scripts/data-health.ts`](../scripts/data-health.ts) 输出经目/段落/辞典/KG/白话/地理计数；`--strict` 要求 sutra、dict、kg_relation > 0。

---

## 代码修复

| 问题 | 修复 |
|------|------|
| `getSutrasForPerson` 查错表 | 改为 `translated` 关系 JOIN `kg_entity(text)` JOIN `sutra` |
| Chat 输入 disabled | 移除 `disabled={!activeId}`，`handleSend` 已自动建对话 |
| 搜索「仅有白话」facet | `colloquialSutraIds` 为空时不渲染 |
| 平行对读默认白话 | `getAvailableVersions(paragraphs)` 驱动选项与默认右栏 |
| 人物页空白 | 无关系/经目时显示引导文案 |

---

## 测试

- 单元：[`tests/kg/graph.test.ts`](../tests/kg/graph.test.ts)、[`tests/parallel/version-selector.test.ts`](../tests/parallel/version-selector.test.ts)
- E2E：[`e2e/feature-matrix.spec.ts`](../e2e/feature-matrix.spec.ts)，更新 [`e2e/fojin-parity.spec.ts`](../e2e/fojin-parity.spec.ts) chat 用例

---

## 未纳入范围

- 全量白话内容生成（需语料协作或 AI batch）
- DILA place/monastery 实体导入（尚无实现）
- 伪造地理坐标

---

## 成功标准

1. `npm run data:health -- --strict` 通过  
2. `npm test` 与 `npm run e2e:mock` 全绿  
3. `/kg` 有连线、`/chat` 可直接输入、`/person` 有相关经目  
4. 无白话/地理数据时 UI 不误导用户
