# Chat 页面覆盖（Immersive · Soft Paper Depth）

> 覆盖 MASTER.md 中 Immersive 布局规则

## Soft Paper Depth

Chat 页采用 **无边框沉浸**：分区靠背景色阶 + 柔和阴影，**禁止**结构性 `border-*`（markdown 内 blockquote/table 除外）。

| 手段 | 用途 |
|------|------|
| `--jx-paper-deep` / `--background` 色阶 | 侧栏 vs 主区 |
| `--shadow-jx-sm` / `--shadow-jx-hero` | 面板、气泡、输入 dock |
| `gap` + 圆角 inset 面板 | 侧栏与主区间呼吸感 |
| 渐变 `jx-chat-dock` | 消息向输入区自然淡出 |

## 布局

- 高度：`calc(100dvh - var(--jx-header-height))`
- 外层：`jx-chat-viewport` + padding + gap
- 侧栏：`jx-chat-sidebar` 圆角纸色面板，无 border-r
- 主区：`jx-chat-main` 圆角主列
- 消息列宽：`max-w-3xl` 居中
- 无 SiteFooter

## 品牌

- 页内标题：**AI 问经**
- 侧栏顶区：Bot icon + 标题 + `.jx-section-label`「对话记录」

## 空态 Hero

- `.chat-empty-glow` + Lucide `Bot`
- h2「向 AI 问经」+ 副文案
- `.chat-hot-card` 阴影卡片，`data-testid="chat-hot-question"`

## 消息

- 用户：`.chat-bubble-user` 朱砂 + shadow
- 助手：`.chat-bubble-assistant` paper-deep + shadow，无边框
- 正文：`.chat-markdown`，`--jx-reading-font`
- 引用：`.chat-citation-pill`，朱砂浅底，`data-testid="chat-citation-chip"`

## 输入

- `.jx-chat-dock` 渐变浮动区
- `.chat-input-shell` shadow-first，focus ring
- hint：Enter 发送 · Shift+Enter 换行

## 禁止

- SiteFooter 在 chat 路由显示
- 结构性 border（顶栏/侧栏/输入/气泡/热门卡片）
- button 嵌套 button
- hover translateY / scale
- emoji 作为 UI 图标
