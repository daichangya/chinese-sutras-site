# 分享页 / 导出卡片覆盖

> 覆盖 MASTER.md 中通用规则

## 画布

- 固定 **1080 × 1350 px**（4:5 竖版）
- 预览在窄屏下 scale 至 max 540px 宽；导出 clone 离屏全尺寸截图

## 视觉

- 背景：`linear-gradient(135deg, #fffefb, #f8f5ef, rgb(139 37 0 / 0.04))`
- 边框：`#dcc9a0`
- 引文：Noto Serif SC，28–36px 自适应；左侧 3px 朱砂竖条
- 引文区 min-height 480px，短句垂直居中
- QR：footer 右侧 +「扫码阅读原文」
- 右上淡角标 SVG（同 daily-verse-card）

## 禁止

- `#b45309` / `amber-*`
- 横版 540px Canvas 布局
- 预览 DOM 与导出 PNG 样式分叉

## 组件

- `ShareCardExport` — 唯一导出源 `#share-card-export`
- `exportShareCardImage()` — html2canvas scale 2
