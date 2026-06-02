# 抄经功能增强设计文档

> **状态：** 待实施 | **日期：** 2026-06-02

## 现状分析

项目已有完整的抄经基础框架：
- ✅ 路由 `/sutra/[slug]/copybook` 已存在
- ✅ 组件：`CopybookShell`、`CopybookConfig`、`CopybookPreview`、`grid-renderer`、`text-utils`、`use-copybook-font`
- ✅ 功能：段落选择、格子类型（米字格/田字格/九宫格）、书写模式（正常/描红/临摹）、简繁转换、PNG/PDF 下载
- ✅ 字体：玄冬楷书（6775字），从 Selftrace 已复制
- ✅ 阅读页已有「开始抄经」入口按钮
- ✅ 测试覆盖：grid-renderer、text-utils、mvp-canon

相比 Selftrace 的差距：
- ❌ 仅 1 种字体（玄冬楷书），Selftrace 有 9 种本地字体
- ❌ 无碑帖拓片动态加载（Selftrace 的 40+ 碑帖 API）
- ❌ 无字符覆盖率检查（用户不知道哪些字有碑帖）
- ❌ 无快捷经文预设（Selftrace 的 stele-tag 快捷按钮）
- ❌ 无竖排标题渲染（Selftrace 的标题区更完整）

## 目标

将抄经功能从「可用」提升到「可作为网站卖点」的水准，核心差距在字体丰富度和用户体验。

## 架构决策

### 字体策略

不引入 Selftrace 全部 9 种字体（总计 ~75MB，严重影响首屏）。选择 3 种核心字体：

| 字体 | 字数 | 大小 | 用途 |
|------|------|------|------|
| 玄冬楷书（已有） | 6775 | 7.1MB | 默认字体，覆盖大部分经文 |
| 青柳隶书 | 12204 | 4.2MB | 隶书风格，覆盖最广 |
| 齐伋体 | 5856 | 4.7MB | 刻本风格，古籍感 |

总增量：~9MB，按需加载（用户选择时才加载）。

### 不纳入首期的功能

- **碑帖拓片动态加载**：需要 API 端（Selftrace 的 `api/stele-image.js`），涉及外部网站爬取和缓存策略，复杂度太高
- **描经（笔画动画）**：需要独立的 stroke JSON 数据库（~90 个文件），与经文数据库无直接关联
- **甲骨文/篆书/草书**：字数太少，不适合抄经场景

## 设计

### 1. 多字体支持

- `useCopybookFont` 改为多字体加载器，按需加载用户选择的字体
- `grid-renderer` 增加字体选项映射
- `CopybookConfig` 增加字体下拉选项

### 2. 字符覆盖率检查

- 引入 Selftrace 的 `stele_chars.js` 数据（仅需要的 3 种字体）
- 在 `CopybookConfig` 底部显示覆盖率信息（已有碑帖 vs 缺失字符）

### 3. 快捷经文预设

- 在 `CopybookConfig` 顶部增加常用经文快捷按钮（心经、金刚经常用段落）

### 4. 视觉增强

- 字帖标题区增加经名 + 字体名 + 格子类型的完整信息
- 缺失字符的格子显示占位符（交叉线 + 灰色小字），复用 Selftrace 的 `drawMissingPlaceholder`

### 5. 抄经范围扩展

目前仅 MVP 经典（`isMvpSutra`）支持抄经。首期完成后，应评估是否开放给更多经典。

## 文件清单

| 操作 | 文件 | 说明 |
|------|------|------|
| 修改 | `components/copybook/use-copybook-font.ts` | 改为多字体按需加载 |
| 修改 | `components/copybook/grid-renderer.ts` | 增加字体选项、缺失字符占位 |
| 修改 | `components/copybook/copybook-config.tsx` | 字体下拉增加选项、覆盖率信息 |
| 新增 | `components/copybook/char-coverage.ts` | 字符覆盖率检查工具 |
| 新增 | `lib/copybook/char-sets.ts` | 从 Selftrace 提取的字符集合数据 |
| 复制 | `Selftrace/frontend/fonts/AoyagiLishu.ttf` → `public/fonts/aoyagi-lishu.ttf` |
| 复制 | `Selftrace/frontend/fonts/qiji.ttf` → `public/fonts/qiji.ttf` |
| 修改 | `tests/copybook/grid-renderer.test.ts` | 增加多字体测试 |
| 修改 | `tests/copybook/text-utils.test.ts` | 增加覆盖率测试 |
