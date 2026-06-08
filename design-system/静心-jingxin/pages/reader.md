# 阅读器页面覆盖

> 覆盖 MASTER.md 中阅读层规则

## 风格

- E-Ink/Paper：高对比 `#1c1917` on `#fffefb`
- `prose-jx reader-body` 衬线正文
- 首字下沉用 `--jx-accent-cinnabar`

## Chrome

- 工具栏 icon + 短文字标签，分组：`目录(移动) | 字号/简繁/白话 | 收藏/分享 | 对读/抄经 | 理解(移动) | 设置`
- xl+ 三栏：TOC 左 + 正文中 + 理解面板右
- xl- 抽屉：`目录` / `理解` 互斥

## 禁止

- sans-serif 高密度 CBETA 流式排版
- `amber-*` 色类
- 经头重复译者卡片；阅读器内独立主题切换

## xl 断点布局 (≥1280px)

- 左栏：TOC sidebar，`w-48`
- 中栏：`prose-jx`，`--jx-measure` 38rem
- 右栏：`ComprehensionPanel`（辞典 / 解释 / 相似 Tab），`--jx-sidebar-width`
- 工具栏「目录」「理解」按钮隐藏（`xl:hidden`）

## 理解面板

- 空态：紧凑引导 + 当前段相似预览
- 有划选：辞典 + AI 解释（现代/背景/生活）+ 相似段落
- `data-testid="reader-comprehension-panel"`

## 工具栏

- icon + 短文字标签，`ToolIconButton`
- 边框 `--jx-border`，背景 paper-elevated
- 设置下拉：行距、拼音（`reader-settings-menu`）
