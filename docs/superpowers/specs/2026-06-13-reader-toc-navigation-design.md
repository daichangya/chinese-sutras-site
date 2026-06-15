# 阅读器目录导航设计（方案 C）

> 日期：2026-06-13  
> 作者：代长亚

## 背景

左侧目录（`ReaderToc`）点击段落摘录或分卷后，用户反馈「没有跳转或高亮不变」。根因：

1. 段落使用原生 `#p-{seq}` 锚点，不更新 `activeParagraphId`
2. 段落元素缺少 `scroll-margin-top`，滚入视口后被顶栏遮挡
3. 分卷 URL 与顶栏 `ChapterNav` 不一致（`?chapter=0` vs 无参数）
4. 初始 hash / 阅读进度恢复分散在两处，可能竞态

## 目标

统一阅读器内所有段落与分卷导航逻辑，保证：

- 点击目录段落 → 平滑滚动 + 高亮同步
- 外链 `#p-N` → 进页自动定位
- 无 hash 时 → 恢复上次阅读进度
- 分卷链接格式统一
- 小屏抽屉点段落后自动关闭

## 架构（方案 C）

```
lib/reader/paragraph-navigation.ts   # 纯函数：hash、URL、scroll
lib/reader/use-reader-navigation.ts  # Hook：状态 + 初始恢复 + 对外 API
components/reader/reader-toc.tsx     # 受控目录，调用 hook API
components/reader/reader-shell.tsx   # 挂载 hook，传给 TOC / speech / progress
lib/reader/use-reading-progress.ts   # 仅负责进度 POST 保存
```

### `paragraph-navigation.ts`

| 函数 | 职责 |
|------|------|
| `parseParagraphHash` | 解析 `#p-{seq}` |
| `buildParagraphHash` | 生成 hash |
| `buildChapterHref` | 分卷 URL（0 → 无 query） |
| `scrollToParagraphElement` | DOM 滚动 |
| `navigateToParagraph` | 查段 + 滚动，返回 paragraphId |

### `useReaderNavigation`

返回：

- `activeParagraphId` / `setActiveParagraphId`
- `goToParagraph(seq)` — 目录、相似段等复用
- `goToParagraphId(id)` — 朗读、右键等复用
- `getChapterHref(chapterSeq)` — 目录与顶栏一致

初始定位优先级：**URL hash > 阅读进度 API > 默认首段**

### `ReaderToc` 变更

- 段落：`<button onClick>` + `onNavigateParagraph(seq)`
- 分卷：`<Link href={getChapterHref(c)}>`
- 小屏 `embedded`：`onAfterNavigate` 关闭抽屉

## 样式

```css
.prose-jx p[id] {
  scroll-margin-top: calc(var(--jx-header-height, 3.5rem) + 1rem);
}
```

## 测试

| 层级 | 文件 | 覆盖 |
|------|------|------|
| 单元 | `tests/reader/paragraph-navigation.test.ts` | hash、URL、滚动、navigate |
| E2E | `e2e/home-reader.spec.ts` | 目录点击滚动 + 高亮 |

## 非目标（本期）

- Scroll Spy（滚动时自动更新目录高亮）— 可后续在 hook 内加 `IntersectionObserver`
- 目录展示全部段落（仍采样约 12 项）

## testid

- `reader-toc-sidebar`
- `reader-toc-paragraphs`
- `reader-toc-item-{seq}`
- `reader-toc-chapter-{n}` / `reader-toc-chapter-active`
