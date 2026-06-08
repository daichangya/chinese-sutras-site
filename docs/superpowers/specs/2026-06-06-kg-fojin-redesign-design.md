# 知识图谱 FoJin 深度重设计

> 日期：2026-06-06  
> 状态：实施中  
> 作者：jingxin

## 目标

将静心知识图谱从「技术 ID + 静态圆环图」升级为 FoJin 级探索体验，同时消除 `kg:person:heuristic:…` 对普通用户的干扰。

## 核心变更

1. **数据可见性**：heuristic 人物不出现在搜索/默认子图/人物页；译者优先匹配 DILA authoritative
2. **友好 URL**：`/person/dila-A000294` 替代 `/person/kg:person:dila:A000294`
3. **API**：search、entity、graph(BFS)、stats、timeline、geo、lineage-arcs
4. **UI**：三栏探索器（搜索 | D3 力导向图 | 实体卡片）、Deck.GL 地图、中文标签

## 参考

- FoJin：`fojin/frontend/src/pages/KnowledgeGraphPage.tsx`
- 静心现状：`components/kg/kg-graph-view.tsx`

## 验收

- [ ] `/kg` 三栏布局，搜索「玄奘」可消歧
- [ ] 人物页 slug URL，无 heuristic ID 暴露
- [ ] `/places` Deck.GL 或友好空态
- [ ] 阅读译者卡片链到 slug
- [ ] 单元测试 + E2E 通过
