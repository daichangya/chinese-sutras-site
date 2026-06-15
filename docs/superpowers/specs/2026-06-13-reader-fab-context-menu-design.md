# 阅读器 FAB + 右键菜单

**日期:** 2026-06-13  
**状态:** 已实现  
**范围:** 移除经头下全宽工具栏；FAB + 设置面板 + 正文右键/长按菜单

---

## 背景

全宽 sticky 工具栏占屏、打断阅读流。用户选择：右下角 FAB 承载常用全局操作；划选相关功能进右键/长按菜单；次要功能进设置面板。

## 功能归属

| 功能 | 入口 |
|------|------|
| 分享、复制、查辞典、AI 解释、从本段朗读 | 右键/长按（正文内） |
| 朗读、收藏、目录/理解（xl 以下） | FAB 展开 |
| 字号、行距、拼音、简繁、白话、朗读引擎/语速、对读、抄经 | 设置面板（FAB → 设置） |

## 不变

经头、三栏侧栏、`prose-jx` 正文、`ReaderSpeechBar`。

## testid 映射

| 旧 | 新 |
|----|-----|
| `reader-toolbar` | `reader-fab` |
| `reader-tool-speech` | FAB 展开内保留 |
| `reader-settings-menu` | FAB 展开 → 设置按钮 |
| 分享 | `reader-context-share` |

## 测试

- `tests/reader/context-actions.test.ts` — 划选/段落文本解析
- E2E：`reader-fab`、FAB 展开后 speech/settings、右键分享
