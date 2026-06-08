# 知识图谱搜索类型缺口修复

**日期**: 2026-06-06  
**状态**: 已实现  
**FoJin 参考**: `fojin/backend/alembic/versions/0037_seed_schools_and_lineages.py`, `0094_seed_places_and_concepts.py`

## 问题

- 搜「禅宗」无 school 实体（库中 `school=0`）
- 搜「白马寺」选「寺院」类型无结果（DILA PT0053 为 `place`，与 FoJin 一致）
- 类型下拉显示无数据类型；chip 点击存在 state 竞态

## 方案

### 数据补齐

`npm run kg:seed:curated` 移植 FoJin 0037/0094：

- 12 个 school、18 个 concept、25 个 canonical place
- `member_of_school`、`teacher_of`、`active_in`、`associated_with` 关系
- ID 约定：`kg:school:seed:禅宗` 等；与 DILA 实体按 `name_zh` 去重 merge

### 搜索

- 「寺院」筛选：`monastery` OR 名称以寺/院/庵结尾的 `place`
- OpenCC 简繁 query 变体
- type 优先级：school > person > concept > …
- 类型无结果时回退全部类型，UI 显示 `relaxedType` 提示
- `region_hint` 用于同名 place 消歧

### UI

- `KgToolbar` 按 `entityCounts` 隐藏 0 计数类型
- `runSearchWith({ q, type })` 修复 chip 竞态
- `pickCurated` 仅在类型有数据时设 filter

## 验收

- 搜「禅宗」命中 school 实体
- 搜「白马寺」+ 寺院类型可命中
- 类型下拉仅显示有数据项
- `npm test` + E2E 通过

## 测试

```bash
npm run kg:seed:curated && npm run kg:import:sqlite
npm test -- tests/kg/search.test.ts tests/kg/seed-fojin-curated.test.ts
npm run e2e:mock -- e2e/kg-explorer.spec.ts
```
