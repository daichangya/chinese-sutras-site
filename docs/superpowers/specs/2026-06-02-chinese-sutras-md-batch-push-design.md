# chinese-sutras-md 分批推送 GitHub 设计

**日期：** 2026-06-02  
**状态：** 已批准

## 背景

语料库约 3.1GB、116,354 文件。单次 `git add .` + 单 commit + `git push` 耗时长、易中断且难以续传。

## 目标

- 将 `jingxin/chinese-sutras-md/` 作为独立仓库推送到 `git@github.com:daichangya/chinese-sutras-md.git`
- 按 **23 个部类顶层目录** 分批 commit + push（约 24 次，含 README 首批）
- 失败后可从下一部类续推

## 方案

1. 撤销本地 monolithic commit（`git update-ref -d HEAD`），保留工作区文件
2. 使用 `push-by-dept.sh`：
   - Commit 1：`README.md`、`.gitignore`、脚本
   - Commit 2–24：逐部类 `git add "{部类}/"` → commit → push
3. SSH：`ServerAliveInterval=60` 降低断线概率

## 与 jingxin 关系

- `chinese-sutras-md/` 仍在 jingxin 内，由 jingxin `.gitignore` 忽略
- `CORPUS_DIR` 默认 `chinese-sutras-md`，`npm run corpus:*` 不变

## 验证

- `git ls-remote origin main` 有 HEAD
- GitHub 根目录可见 23 部类 + README
- `npm run corpus:stats` 在 jingxin 根目录正常
