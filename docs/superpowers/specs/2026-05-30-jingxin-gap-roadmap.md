# jingxin MVP 后补强路线图

**日期：** 2026-05-30  
**作者：** jingxin  
**状态：** 四期已完成；**五期**（白话分层 + 视觉）见 [2026-05-31-jingxin-phase5-content-visual-design.md](./2026-05-31-jingxin-phase5-content-visual-design.md)；**六期**（全站视觉收尾）见 [2026-05-31-jingxin-phase6-visual-surface-design.md](./2026-05-31-jingxin-phase6-visual-surface-design.md)；**七期**（MVP 数据补全）见 [2026-05-31-jingxin-phase7-data-completeness-design.md](./2026-05-31-jingxin-phase7-data-completeness-design.md)；**八期 A**（全藏 MD 生成，不入库）见 [2026-05-31-jingxin-full-corpus-md-design.md](./2026-05-31-jingxin-full-corpus-md-design.md)

---

## 北极星

用户觉得「读懂了一句」，而不是「搜到了一部经」。

---

## 四期补强

| 期 | 目标 | 关键交付 |
|----|------|----------|
| 一期 | 体验 | 阅读排版、首页卡片、分享页、大经分卷导航 |
| 二期 | 内容 | 剥离序文、11 经语料质量、白话流水线、固定 MVP 经目 |
| 三期 | AI | 黄金集测试、今日经句刷新脚本、免责强化、Mock E2E |
| 四期 | 专题/V2 | topic intro/法语、专题页模板、划选高亮笔记 |

**明确不做（除非单独立项）：** 全藏 5000 经 corpus、Neo4j/ES、社区、问经 RAG。

---

## 成功标准

- 30 秒内：首页 → 心经正文 → 划选 → 白话或 AI 解释
- 心经首屏非明太祖序文
- `/verse/today` 具备 OG 与卡片式分享页
- 专题「空性」有导读与经目卡片，非纯链接列表

详见各期实现与 [`openspec/changes/jingxin-post-mvp-polish/`](../..//openspec/changes/jingxin-post-mvp-polish/proposal.md)。
