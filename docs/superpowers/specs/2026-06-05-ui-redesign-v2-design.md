# 静心 UI 全站重设计 v2

> 日期：2026-06-05  
> 状态：实施中  
> 作者：jingxin

## 目标

完成 2026-06-03 FoJin 对齐规格的**真正收敛**：统一配色 token、重建发现层门户、阅读层 E-Ink 沉浸、共享组件层，清除全站 `amber-*` 硬编码。

## 策略（混合古典门户 v2）

| 层次 | 策略 |
|------|------|
| 发现层 | FoJin 古典门户：宣纸 `#f8f5ef`、水墨背景、朱砂 CTA、金饰点缀、门户密度 |
| 阅读层 | E-Ink/Paper：高对比衬线、`prose-jx`、最小 chrome |
| Token | 单一体系，废弃 amber `#b45309`，cinnabar `#8b2500` 为主强调色 |
| 组件 | 扩展 `components/ui/`：PageShell、SectionHeader、Chip、Card、Input、EmptyState |

## Token 映射

| CSS 变量 | 值 | 用途 |
|----------|-----|------|
| `--jx-paper` | `#f8f5ef` | 页面底色 |
| `--jx-ink-classical` | `#2b2318` | 壳层标题/导航 |
| `--jx-accent-cinnabar` | `#8b2500` | 主 CTA、搜索、高亮 |
| `--jx-gold` | `#b08d57` | 统计、装饰线 |
| `--jx-border` | `#d9d0c1` | 边框 |
| `--jx-card-bg` | `rgba(255,255,255,0.6)` | 半透明卡片 |
| `--jx-header-height` | `52px` | 顶栏高度 |
| `--jx-accent` | alias → cinnabar | 迁移期兼容 |

## 布局规范（v2.1）

| 级别 | 类名 | 宽度 |
|------|------|------|
| Shell | `.jx-shell` | `80rem` (1280px) |
| Page | `.jx-page` | `75rem` (1200px) |
| Hero | `.jx-hero-content` | `75rem` (1200px) |
| Combo 搜索 | `.jx-combo-search` | `48.75rem` (780px) |
| Reader | `.jx-reader` | `80rem` (1280px) 外壳；正文 `--jx-measure` 38rem 不变 |
| Full | `.jx-full` | `100vh - header` |

## 字体

- 展示：Ma Shan Zheng（仅首页标题）
- 壳层：`--jx-ui-font`（Noto Sans SC）
- 阅读：`--jx-reading-font`（Noto Serif SC，`prose-jx`）

body 默认 sans（壳层），阅读区显式 serif。

## 分阶段交付

1. **Phase 0**：本文档 + `design-system/静心-jingxin/MASTER.md`
2. **Phase 1**：`app/globals.css` token 重建
3. **Phase 2**：布局壳层 + 共享 UI 组件
4. **Phase 3**：发现层（首页/搜索/辞典/经藏/图谱/地理）
5. **Phase 4**：阅读层（经页/对读/字帖）
6. **Phase 5**：次级页面清扫
7. **Phase 6**：E2E + lint-ui-tokens

## 刻意不做

- 不引入 Ant Design
- 不复制 FoJin 503 源选择器、8 法师人格、BYOK
- 不从 fojin.app 爬取资产
- 不把经页改成 sans-serif CBETA 排版

## 测试

- `scripts/lint-ui-tokens.ts`：禁止 `amber-` 于 `app/`、`components/`
- 扩展 `e2e/fojin-parity.spec.ts`
- `npm run verify`

## 参考

- FoJin：`fojin/frontend/src/styles/`
- 旧 spec：`docs/superpowers/specs/2026-06-03-fojin-ui-parity-design.md`
- 设计系统：`design-system/静心-jingxin/MASTER.md`
