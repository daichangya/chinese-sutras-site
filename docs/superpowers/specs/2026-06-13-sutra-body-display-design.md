# 经正文展示设计（序跋分层）

**日期：** 2026-06-13  
**作者：** 代长亚  
**状态：** 已实现

---

## 问题

CBETA 经目常含帝王序、撰序等非正文段落。若与正文平铺展示，会导致：

1. 首屏出现序文而非经正文（如心经「二仪久判…」）
2. CSS 首字装饰落在序文首段
3. 目录 / 阅读进度锚到序文

## 方案

**段落角色（`block_role`）+ 阅读器分区**

| 角色 | 默认阅读 |
|------|----------|
| `preface` / `colophon` / `byline` | 折叠「经前序跋」 |
| `body` / `verse` | 主阅读区 |

## 数据流

```
XML --stripPreface--> MD + blocks.jsonl (block_role)
        |
        v
import-align (infer 兜底) --> paragraph.block_role
        |
        v
queries (默认过滤) --> reader-shell 分区渲染
```

## 关键文件

| 层 | 文件 |
|----|------|
| 结构 | `lib/cbeta/structure.ts`, `lib/cbeta/block-role.ts` |
| 语料 | `lib/corpus-v3/gen.ts`, `lib/corpus-v3/blocks-index.ts` |
| 导入 | `lib/corpus-v3/import-align.ts`, `lib/corpus-v3/infer-block-role.ts` |
| 查询 | `lib/sutra/queries.ts` |
| 阅读器 | `components/reader/reader-shell.tsx`, `app/globals.css` |

## 测试

- 单元：`tests/corpus-v3/infer-block-role.test.ts`, `tests/sutra/queries-body-filter.test.ts`
- 集成：`tests/corpus-v3/xinjing-body-display.test.ts`
- E2E：`e2e/home-reader.spec.ts` 心经首段断言

## 非目标（本期）

- 按句重新切分心经
- 全藏批量重生成
