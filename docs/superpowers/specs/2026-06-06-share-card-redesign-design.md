# 分享卡片 Redesign

> 日期：2026-06-06  
> 状态：已批准，实施中  
> 作者：jingxin

## 目标

将经文分享导出图从「横版 Canvas + 琥珀色 + 预览≠下载」升级为与静心品牌一致的 **竖版 4:5 引述海报**，预览与 PNG 导出 WYSIWYG 统一。

## 问题摘要

| 问题 | 根因 |
|------|------|
| 配色偏橙 | Canvas 硬编码 `#b45309`，未用朱砂 `#8b2500` |
| 字体廉价 | generic `serif`，未用 Noto Serif SC |
| 布局空洞 | 540px 横版 + QR 右上角 + 短摘录 |
| 预览 ≠ 下载 | DOM 预览与 Canvas 生成分离 |
| 品牌不一致 | 未复用 daily-verse / jx-verse-quote 视觉 |

## 方案

**竖版 4:5 引述海报 + DOM 导出（html2canvas）**

- 画布：1080 × 1350 px（4:5，适配朋友圈/小红书）
- 单一 `ShareCardExport` 组件 = 预览 = 导出源
- 设计 token 集中于 `lib/share/share-card-tokens.ts`
- 导出前 clone 节点至无 transform 的离屏位置，保证像素尺寸正确

## 视觉规范

对齐 `design-system/静心-jingxin/MASTER.md` 与 `daily-verse-card`：

- 背景：`linear-gradient(135deg, #fffefb, #f8f5ef, rgb(139 37 0 / 0.04))`
- 边框：`#dcc9a0`
- 正文：`#2b2318`（`--jx-ink-classical`）
- 强调：`#8b2500`（朱砂）
- 装饰金：`#b08d57`
- 字体：标题/引文 Noto Serif SC；标签/footer Noto Sans SC
- 引文区 min-height 480px，短句垂直居中
- 引文左侧 3px 朱砂竖条 + 半透明引号装饰
- QR 在底部 footer 右侧，附「扫码阅读原文」

## 架构

```
SharePage → ShareCard (页面壳 + 操作按钮)
              └── ShareCardExport (#share-card-export)
                      ↓ 下载
              exportShareCardImage() → html2canvas → PNG
```

## 文件变更

| 文件 | 动作 |
|------|------|
| `lib/share/share-card-tokens.ts` | 新建 token + 引文字号计算 |
| `components/reader/share-card-export.tsx` | 新建导出卡片 UI |
| `lib/share/export-share-image.ts` | 新建 DOM 截图导出 |
| `components/reader/share-card.tsx` | 改用 ShareCardExport + 新导出路径 |
| `lib/share/generate-share-card.ts` | 保留 downloadCanvasAsPNG；Canvas 生成标记 deprecated |
| `design-system/静心-jingxin/pages/share.md` | 页面 override |
| `app/share/[id]/page.tsx` | 友好 slug（getMvpSlugByCbetaId） |

## 测试

- 单元：`share-card-tokens` 色值与字号降级
- E2E：分享页 `#share-card-export` 可见 + 下载按钮可点

## 成功标准

- PNG 与预览视觉一致
- 无 amber 色，符合 MASTER
- 短摘录无大面积 awkward 留白
- 竖版 4:5 适合中文社交分享
