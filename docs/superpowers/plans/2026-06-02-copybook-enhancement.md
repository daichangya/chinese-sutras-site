# 抄经功能增强实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将抄经功能从基础可用提升到可作为网站卖点的水准，增加多字体支持、字符覆盖率检查和视觉增强。

**Architecture:** 在现有抄经框架上扩展，新增 2 种字体（青柳隶书、齐伋体），构建字符覆盖率检查工具，优化字帖标题区和缺失字符占位符。所有改动为纯前端，无需后端。

**Tech Stack:** Next.js 15, React 19, TypeScript, Canvas API, jsPDF, FontFace API

---

### Task 1: 复制字体文件到 public/fonts/

**Files:**
- Copy: `Selftrace/frontend/fonts/AoyagiLishu.ttf` → `public/fonts/aoyagi-lishu.ttf`
- Copy: `Selftrace/frontend/fonts/qiji.ttf` → `public/fonts/qiji.ttf`

- [ ] **Step 1: 复制字体文件**

```bash
cp Selftrace/frontend/fonts/AoyagiLishu.ttf public/fonts/aoyagi-lishu.ttf
cp Selftrace/frontend/fonts/qiji.ttf public/fonts/qiji.ttf
```

- [ ] **Step 2: 验证文件存在**

Run: `ls -la public/fonts/`
Expected: 3 个文件 — `xuandong-kaishu.ttf`, `aoyagi-lishu.ttf`, `qiji.ttf`

- [ ] **Step 3: Commit**

```bash
git add public/fonts/aoyagi-lishu.ttf public/fonts/qiji.ttf
git commit -m "feat: add aoyagi lishu and qiji fonts for copybook"
```

---

### Task 2: 构建字符集合数据 (`lib/copybook/char-sets.ts`)

**Files:**
- Create: `lib/copybook/char-sets.ts` — 从 Selftrace 提取的 3 种字体字符集合

从 `Selftrace/frontend/stele_chars.js` 中提取 AOYAGILISHU_CHARS, QIJI_CHARS, XUANDONGKAI_CHARS 的字符内容，导出为 Set。由于原文件是 JS Set 字面量，我们需要将其转为 TS 可消费的数据。最简洁的方式是将字符字符串提取为 const，运行时再 new Set。

- [ ] **Step 1: 提取字符数据**

从 Selftrace 中提取 3 种字体的字符字符串：

```bash
node -e "
const fs = require('fs');
const content = fs.readFileSync('Selftrace/frontend/stele_chars.js', 'utf8');
// Extract AOYAGILISHU_CHARS (line 4), QIJI_CHARS (line 5), XUANDONGKAI_CHARS (line 6)
const lines = content.split('\\n');
const extract = (lineIdx) => {
  const m = lines[lineIdx].match(/new Set\(\[\.\.\.\"([^\"]*)\"\]\)/);
  return m ? m[1] : '';
};
const result = {
  aoyagilishu: extract(3),
  qiji: extract(4),
  xuandongkai: extract(5)
};
fs.writeFileSync('lib/copybook/char-sets-data.json', JSON.stringify(result));
console.log('Extracted:', Object.fromEntries(Object.entries(result).map(([k,v]) => [k, v.length])));
"
mkdir -p lib/copybook
```

- [ ] **Step 2: 创建 char-sets.ts**

Create `lib/copybook/char-sets.ts`:

```typescript
/**
 * 抄经字体字符集合 — 用于覆盖率检查
 * 数据提取自 Selftrace/frontend/stele_chars.js
 * @author jingxin
 */

import charSetsData from "./char-sets-data.json";

export const AoyagiLishuChars = new Set(charSetsData.aoyagilishu as string);
export const QijiChars = new Set(charSetsData.qiji as string);
export const XuandongKaiChars = new Set(charSetsData.xuandongkai as string);

export const COPYBOOK_CHAR_SETS: Record<string, Set<string>> = {
  aoyagi: AoyagiLishuChars,
  qiji: QijiChars,
  xuandong: XuandongKaiChars,
};
```

- [ ] **Step 3: 更新 tsconfig.json 以支持 JSON import**

Read `tsconfig.json` to check if `resolveJsonModule` is already set. If not, add it.

Run: `cat tsconfig.json | grep resolveJsonModule`
Expected: if present, skip. If not, add `"resolveJsonModule": true` to `compilerOptions`.

If needed:
```bash
# Only if resolveJsonModule is missing
node -e "
const fs = require('fs');
const ts = JSON.parse(fs.readFileSync('tsconfig.json','utf8'));
ts.compilerOptions.resolveJsonModule = true;
fs.writeFileSync('tsconfig.json', JSON.stringify(ts, null, 2));
"
```

- [ ] **Step 4: 验证构建**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add lib/copybook/char-sets.ts lib/copybook/char-sets-data.json
git commit -m "feat: add character sets for copybook coverage checking"
```

---

### Task 3: 字符覆盖率检查工具 (`components/copybook/char-coverage.ts`)

**Files:**
- Create: `components/copybook/char-coverage.ts` — 字符覆盖率检查

- [ ] **Step 1: Write tests**

Create `tests/copybook/char-coverage.test.ts`:

```typescript
/**
 * 字符覆盖率测试
 * @author jingxin
 */
import { describe, expect, it } from "vitest";
import { checkCoverage, type CoverageResult } from "@/components/copybook/char-coverage";

describe("checkCoverage", () => {
  it("全部字符都有覆盖", () => {
    const result = checkCoverage("观自在", "xuandong");
    expect(result.missing).toHaveLength(0);
    expect(result.total).toBe(3);
  });

  it("部分字符缺失", () => {
    const result = checkCoverage("觀自在", "xuandong");
    // 繁体字可能不在简体字库中
    expect(result.total).toBe(3);
    expect(result.found + result.missing.length).toBe(3);
  });

  it("空文本返回零结果", () => {
    const result = checkCoverage("", "xuandong");
    expect(result.total).toBe(0);
    expect(result.found).toBe(0);
    expect(result.missing).toHaveLength(0);
  });

  it("未知字体返回空覆盖", () => {
    const result = checkCoverage("测试", "unknown");
    expect(result.total).toBe(2);
    expect(result.missing).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/copybook/char-coverage.test.ts 2>&1 | tail -10`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write implementation**

Create `components/copybook/char-coverage.ts`:

```typescript
/**
 * 抄经字符覆盖率检查
 * @author jingxin
 */
import { COPYBOOK_CHAR_SETS } from "@/lib/copybook/char-sets";

export type CoverageResult = {
  total: number;
  found: number;
  missing: string[];
  fontChoice: string;
};

export function checkCoverage(text: string, fontChoice: string): CoverageResult {
  const chars = [...text].filter((c) => c.trim());
  const total = chars.length;
  if (total === 0) return { total: 0, found: 0, missing: [], fontChoice };

  const charSet = COPYBOOK_CHAR_SETS[fontChoice];
  if (!charSet) {
    return { total, found: 0, missing: chars, fontChoice };
  }

  const missing: string[] = [];
  let found = 0;
  for (const c of chars) {
    if (charSet.has(c)) {
      found++;
    } else {
      missing.push(c);
    }
  }

  return { total, found, missing, fontChoice };
}

/** 覆盖率百分比（用于 UI 显示） */
export function coveragePercent(result: CoverageResult): number {
  if (result.total === 0) return 100;
  return Math.round((result.found / result.total) * 100);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/copybook/char-coverage.test.ts 2>&1 | tail -10`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/copybook/char-coverage.ts tests/copybook/char-coverage.test.ts
git commit -m "feat: add character coverage checker for copybook"
```

---

### Task 4: 多字体加载 (`components/copybook/use-copybook-font.ts`)

**Files:**
- Modify: `components/copybook/use-copybook-font.ts` — 改为支持 3 种字体

- [ ] **Step 1: Write test**

Add to `tests/copybook/font-loader.test.ts`:

```typescript
/**
 * 字体加载测试
 * @author jingxin
 */
import { describe, expect, it } from "vitest";
import { FONT_CONFIG, type CopybookFontChoice } from "@/components/copybook/use-copybook-font";

describe("FONT_CONFIG", () => {
  it("包含 3 种字体", () => {
    expect(Object.keys(FONT_CONFIG)).toHaveLength(3);
    expect(FONT_CONFIG).toHaveProperty("xuandong");
    expect(FONT_CONFIG).toHaveProperty("aoyagi");
    expect(FONT_CONFIG).toHaveProperty("qiji");
  });

  it("每种字体有 URL 和名称", () => {
    for (const [key, config] of Object.entries(FONT_CONFIG)) {
      expect(config.url).toBeDefined();
      expect(config.name).toBeDefined();
      expect(config.family).toBeDefined();
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/copybook/font-loader.test.ts 2>&1 | tail -10`
Expected: FAIL

- [ ] **Step 3: Write implementation**

Replace `components/copybook/use-copybook-font.ts`:

```typescript
"use client";

/**
 * 抄经多字体按需加载
 * @author jingxin
 */
import { useEffect, useState } from "react";

export type CopybookFontChoice = "xuandong" | "aoyagi" | "qiji";

type FontConfig = {
  family: string;
  name: string;
  url: string;
};

export const FONT_CONFIG: Record<CopybookFontChoice, FontConfig> = {
  xuandong: {
    family: "XuandongKai",
    name: "玄冬楷书",
    url: "/fonts/xuandong-kaishu.ttf",
  },
  aoyagi: {
    family: "AoyagiLishu",
    name: "青柳隶书",
    url: "/fonts/aoyagi-lishu.ttf",
  },
  qiji: {
    family: "Qiji",
    name: "齐伋体",
    url: "/fonts/qiji.ttf",
  },
};

const loadCache: Map<string, Promise<boolean>> = new Map();

async function loadFont(choice: CopybookFontChoice): Promise<boolean> {
  const config = FONT_CONFIG[choice];
  if (typeof document === "undefined") return false;
  if (document.fonts.check(`16px ${config.family}`)) return true;
  if (loadCache.has(choice)) return loadCache.get(choice)!;

  const promise = (async () => {
    try {
      const face = new FontFace(config.family, `url(${config.url})`);
      await face.load();
      document.fonts.add(face);
      return true;
    } catch {
      return false;
    }
  })();
  loadCache.set(choice, promise);
  return promise;
}

export function useCopybookFont(choice: CopybookFontChoice = "xuandong"): {
  ready: boolean;
  failed: boolean;
} {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setReady(false);
    setFailed(false);
    loadFont(choice).then((ok) => {
      setReady(ok);
      setFailed(!ok);
    });
  }, [choice]);

  return { ready, failed };
}

export function getFontFamilyForCanvas(choice: CopybookFontChoice): string {
  const config = FONT_CONFIG[choice];
  return `'${config.family}', 'Noto Serif SC', serif`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/copybook/font-loader.test.ts 2>&1 | tail -10`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/copybook/use-copybook-font.ts tests/copybook/font-loader.test.ts
git commit -m "feat: multi-font loader for copybook"
```

---

### Task 5: 更新 grid-renderer 支持多字体 + 缺失占位符

**Files:**
- Modify: `components/copybook/grid-renderer.ts` — 更新字体选项、Canvas 字体映射、添加缺失字符占位绘制

- [ ] **Step 1: Write tests**

Add to `tests/copybook/grid-renderer.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import {
  canvasFontFamily,
  FONT_LABELS,
  type CopybookFontChoice,
} from "@/components/copybook/grid-renderer";

describe("canvasFontFamily", () => {
  it("玄冬楷书返回正确 family", () => {
    expect(canvasFontFamily("xuandong")).toContain("XuandongKai");
  });

  it("青柳隶书返回正确 family", () => {
    expect(canvasFontFamily("aoyagi")).toContain("AoyagiLishu");
  });

  it("齐伋体返回正确 family", () => {
    expect(canvasFontFamily("qiji")).toContain("Qiji");
  });
});

describe("FONT_LABELS", () => {
  it("包含 3 种字体", () => {
    expect(Object.keys(FONT_LABELS)).toHaveLength(3);
    expect(FONT_LABELS["xuandong"]).toBe("玄冬楷书");
    expect(FONT_LABELS["aoyagi"]).toBe("青柳隶书");
    expect(FONT_LABELS["qiji"]).toBe("齐伋体");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/copybook/grid-renderer.test.ts 2>&1 | tail -15`
Expected: FAIL (FONT_LABELS not exported, canvasFontFamily doesn't accept all 3)

- [ ] **Step 3: Write implementation**

Replace `components/copybook/grid-renderer.ts`:

```typescript
/**
 * 抄经字帖 Canvas 格子与文字绘制
 * @author jingxin
 */

export type GridType = "mi" | "tian" | "jiu" | "none";
export type WriteMode = "normal" | "miaohong" | "linmo";
export type CopybookDirection = "horizontal" | "vertical";
export type CopybookFontChoice = "xuandong" | "aoyagi" | "qiji";

export type CopybookRenderConfig = {
  text: string;
  title: string;
  subtitle?: string;
  cols: number;
  cellSize: number;
  maxRows: number | null;
  gridType: GridType;
  mode: WriteMode;
  direction: CopybookDirection;
  fontChoice: CopybookFontChoice;
};

export const GRID_LABELS: Record<GridType, string> = {
  mi: "米字格",
  tian: "田字格",
  jiu: "九宫格",
  none: "无格线",
};

export const FONT_LABELS: Record<CopybookFontChoice, string> = {
  xuandong: "玄冬楷书",
  aoyagi: "青柳隶书",
  qiji: "齐伋体",
};

export const PAPER_PRESETS = [
  { id: "6x8", label: "6×8 格（80px）", cols: 6, maxRows: 8, cellSize: 80 },
  { id: "8x10", label: "8×10 格（70px）", cols: 8, maxRows: 10, cellSize: 70 },
  { id: "10x12", label: "10×12 格（60px）", cols: 10, maxRows: 12, cellSize: 60 },
  { id: "custom", label: "自定义", cols: 8, maxRows: 10, cellSize: 70 },
] as const;

const PAPER_BG = "#faf6ee";
const TITLE_COLOR = "#5a3a28";

/** 书写模式对应的 fillStyle */
export function modeFillStyle(mode: WriteMode): string {
  if (mode === "normal") return "#1a1008";
  if (mode === "miaohong") return "rgba(180, 40, 30, 0.20)";
  return "rgba(0, 0, 0, 0.10)";
}

export function canvasFontFamily(choice: CopybookFontChoice): string {
  const families: Record<CopybookFontChoice, string> = {
    xuandong: "'XuandongKai', 'Noto Serif SC', serif",
    aoyagi: "'AoyagiLishu', 'Noto Serif SC', serif",
    qiji: "'Qiji', 'Noto Serif SC', serif",
  };
  return families[choice];
}

export function drawGridCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  gridType: GridType,
): void {
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);
  if (gridType === "none") return;

  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  const mid = size / 2;
  ctx.beginPath();
  if (gridType === "mi") {
    ctx.moveTo(x + mid, y);
    ctx.lineTo(x + mid, y + size);
    ctx.moveTo(x, y + mid);
    ctx.lineTo(x + size, y + mid);
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y);
    ctx.lineTo(x, y + size);
  } else if (gridType === "tian") {
    ctx.moveTo(x + mid, y);
    ctx.lineTo(x + mid, y + size);
    ctx.moveTo(x, y + mid);
    ctx.lineTo(x + size, y + mid);
  } else if (gridType === "jiu") {
    const t1 = size / 3;
    const t2 = (size * 2) / 3;
    ctx.moveTo(x + t1, y);
    ctx.lineTo(x + t1, y + size);
    ctx.moveTo(x + t2, y);
    ctx.lineTo(x + t2, y + size);
    ctx.moveTo(x, y + t1);
    ctx.lineTo(x + size, y + t1);
    ctx.moveTo(x, y + t2);
    ctx.lineTo(x + size, y + t2);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

/** 绘制缺失字符占位符（交叉线 + 灰色小字） */
export function drawMissingPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  char: string,
): void {
  ctx.strokeStyle = "#e0d5c5";
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  const m = cellSize * 0.3;
  ctx.beginPath();
  ctx.moveTo(x + m, y + m);
  ctx.lineTo(x + cellSize - m, y + cellSize - m);
  ctx.moveTo(x + cellSize - m, y + m);
  ctx.lineTo(x + m, y + cellSize - m);
  ctx.stroke();

  ctx.font = `${Math.floor(cellSize * 0.75 * 0.3)}px 'Noto Serif SC', sans-serif`;
  ctx.fillStyle = "#ccc";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(char, x + cellSize / 2, y + cellSize / 2);
}

export type LayoutMetrics = {
  cols: number;
  rowCount: number;
  width: number;
  height: number;
  chars: string[];
};

export function computeLayout(cfg: CopybookRenderConfig): LayoutMetrics {
  const chars = [...cfg.text].filter((c) => c.trim());
  let cols: number;
  let rowCount: number;
  const perColumnRows = cfg.maxRows ?? cfg.cols;

  if (cfg.direction === "vertical") {
    rowCount = perColumnRows;
    cols = Math.ceil(chars.length / rowCount) || 1;
  } else {
    cols = cfg.cols;
    const minRows = Math.ceil(chars.length / cols) || 1;
    rowCount = cfg.maxRows ? Math.max(minRows, cfg.maxRows) : minRows;
  }

  const padding = 40;
  const titleHeight = 50;
  const width = cols * cfg.cellSize + padding * 2;
  const height = rowCount * cfg.cellSize + padding * 2 + titleHeight;

  return { cols, rowCount, width, height, chars };
}

function cellPosition(
  index: number,
  cfg: CopybookRenderConfig,
  layoutCols: number,
  perColumnRows: number,
): { row: number; col: number } {
  if (cfg.direction === "vertical") {
    return {
      col: layoutCols - 1 - Math.floor(index / perColumnRows),
      row: index % perColumnRows,
    };
  }
  return {
    row: Math.floor(index / cfg.cols),
    col: index % cfg.cols,
  };
}

/** 在 Canvas 上绘制完整字帖，返回 canvas 元素 */
export function renderCopybookCanvas(cfg: CopybookRenderConfig): HTMLCanvasElement {
  const { cols, rowCount, width, height, chars } = computeLayout(cfg);
  const padding = 40;
  const titleHeight = 50;
  const fontSize = Math.floor(cfg.cellSize * 0.75);
  const fontFamily = canvasFontFamily(cfg.fontChoice);
  const perColumnRows = cfg.maxRows ?? cfg.cols;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = PAPER_BG;
  ctx.fillRect(0, 0, width, height);

  // 标题区：经名 · 字体名 · 格子类型
  ctx.font = `22px ${fontFamily}`;
  ctx.fillStyle = TITLE_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const gridLabel = GRID_LABELS[cfg.gridType] ?? "";
  const fontLabel = FONT_LABELS[cfg.fontChoice] ?? "";
  ctx.fillText(`${cfg.title} · ${fontLabel} · ${gridLabel}`, padding, 36);
  if (cfg.subtitle) {
    ctx.font = "12px 'Noto Serif SC', sans-serif";
    ctx.fillStyle = "#8a7560";
    ctx.fillText(cfg.subtitle, padding, 52);
  }

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = modeFillStyle(cfg.mode);

  // 预计算缺失字符集合（modeFillStyle 为描红/临摹时也需要知道哪些缺失）
  const charSet = require("@/lib/copybook/char-sets").COPYBOOK_CHAR_SETS[cfg.fontChoice];

  chars.forEach((char, i) => {
    const { row, col } = cellPosition(i, cfg, cols, perColumnRows);
    const x = padding + col * cfg.cellSize;
    const y = padding + titleHeight + row * cfg.cellSize;
    drawGridCell(ctx, x, y, cfg.cellSize, cfg.gridType);

    if (charSet?.has(char)) {
      ctx.fillText(char, x + cfg.cellSize / 2, y + cfg.cellSize / 2 + 2);
    } else {
      drawMissingPlaceholder(ctx, x, y, cfg.cellSize, char);
    }
  });

  const totalCells = cols * rowCount;
  for (let i = chars.length; i < totalCells; i++) {
    const { row, col } = cellPosition(i, cfg, cols, perColumnRows);
    const x = padding + col * cfg.cellSize;
    const y = padding + titleHeight + row * cfg.cellSize;
    drawGridCell(ctx, x, y, cfg.cellSize, cfg.gridType);
  }

  return canvas;
}
```

Wait — the `require` in `renderCopybookCanvas` won't work in a client component. Let me fix this approach. The character set check should happen at the React component level, not inside the Canvas renderer. Let me add a `missingChars` field to `CopybookRenderConfig` instead.

Let me revise the approach: add `missingChars: string[]` to `CopybookRenderConfig`, computed in `buildRenderConfig` in `copybook-config.tsx`.

Revised Step 3 - Replace `components/copybook/grid-renderer.ts`:

```typescript
/**
 * 抄经字帖 Canvas 格子与文字绘制
 * @author jingxin
 */

export type GridType = "mi" | "tian" | "jiu" | "none";
export type WriteMode = "normal" | "miaohong" | "linmo";
export type CopybookDirection = "horizontal" | "vertical";
export type CopybookFontChoice = "xuandong" | "aoyagi" | "qiji";

export type CopybookRenderConfig = {
  text: string;
  title: string;
  subtitle?: string;
  cols: number;
  cellSize: number;
  maxRows: number | null;
  gridType: GridType;
  mode: WriteMode;
  direction: CopybookDirection;
  fontChoice: CopybookFontChoice;
  /** 预计算的缺失字符（用于占位绘制） */
  missingChars: string[];
};

export const GRID_LABELS: Record<GridType, string> = {
  mi: "米字格",
  tian: "田字格",
  jiu: "九宫格",
  none: "无格线",
};

export const FONT_LABELS: Record<CopybookFontChoice, string> = {
  xuandong: "玄冬楷书",
  aoyagi: "青柳隶书",
  qiji: "齐伋体",
};

export const PAPER_PRESETS = [
  { id: "6x8", label: "6×8 格（80px）", cols: 6, maxRows: 8, cellSize: 80 },
  { id: "8x10", label: "8×10 格（70px）", cols: 8, maxRows: 10, cellSize: 70 },
  { id: "10x12", label: "10×12 格（60px）", cols: 10, maxRows: 12, cellSize: 60 },
  { id: "custom", label: "自定义", cols: 8, maxRows: 10, cellSize: 70 },
] as const;

const PAPER_BG = "#faf6ee";
const TITLE_COLOR = "#5a3a28";
const MISSING_PLACEHOLDER_COLOR = "rgba(150, 130, 110, 0.15)";

/** 书写模式对应的 fillStyle */
export function modeFillStyle(mode: WriteMode): string {
  if (mode === "normal") return "#1a1008";
  if (mode === "miaohong") return "rgba(180, 40, 30, 0.20)";
  return "rgba(0, 0, 0, 0.10)";
}

export function canvasFontFamily(choice: CopybookFontChoice): string {
  const families: Record<CopybookFontChoice, string> = {
    xuandong: "'XuandongKai', 'Noto Serif SC', serif",
    aoyagi: "'AoyagiLishu', 'Noto Serif SC', serif",
    qiji: "'Qiji', 'Noto Serif SC', serif",
  };
  return families[choice];
}

export function drawGridCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  gridType: GridType,
): void {
  ctx.strokeStyle = "#888";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);
  if (gridType === "none") return;

  ctx.strokeStyle = "#ccc";
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  const mid = size / 2;
  ctx.beginPath();
  if (gridType === "mi") {
    ctx.moveTo(x + mid, y);
    ctx.lineTo(x + mid, y + size);
    ctx.moveTo(x, y + mid);
    ctx.lineTo(x + size, y + mid);
    ctx.moveTo(x, y);
    ctx.lineTo(x + size, y + size);
    ctx.moveTo(x + size, y);
    ctx.lineTo(x, y + size);
  } else if (gridType === "tian") {
    ctx.moveTo(x + mid, y);
    ctx.lineTo(x + mid, y + size);
    ctx.moveTo(x, y + mid);
    ctx.lineTo(x + size, y + mid);
  } else if (gridType === "jiu") {
    const t1 = size / 3;
    const t2 = (size * 2) / 3;
    ctx.moveTo(x + t1, y);
    ctx.lineTo(x + t1, y + size);
    ctx.moveTo(x + t2, y);
    ctx.lineTo(x + t2, y + size);
    ctx.moveTo(x, y + t1);
    ctx.lineTo(x + size, y + t1);
    ctx.moveTo(x, y + t2);
    ctx.lineTo(x + size, y + t2);
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

/** 绘制缺失字符占位符 */
export function drawMissingPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
): void {
  ctx.strokeStyle = MISSING_PLACEHOLDER_COLOR;
  ctx.lineWidth = 1;
  ctx.setLineDash([]);
  const m = cellSize * 0.3;
  ctx.beginPath();
  ctx.moveTo(x + m, y + m);
  ctx.lineTo(x + cellSize - m, y + cellSize - m);
  ctx.moveTo(x + cellSize - m, y + m);
  ctx.lineTo(x + m, y + cellSize - m);
  ctx.stroke();
}

export type LayoutMetrics = {
  cols: number;
  rowCount: number;
  width: number;
  height: number;
  chars: string[];
};

export function computeLayout(cfg: CopybookRenderConfig): LayoutMetrics {
  const chars = [...cfg.text].filter((c) => c.trim());
  let cols: number;
  let rowCount: number;
  const perColumnRows = cfg.maxRows ?? cfg.cols;

  if (cfg.direction === "vertical") {
    rowCount = perColumnRows;
    cols = Math.ceil(chars.length / rowCount) || 1;
  } else {
    cols = cfg.cols;
    const minRows = Math.ceil(chars.length / cols) || 1;
    rowCount = cfg.maxRows ? Math.max(minRows, cfg.maxRows) : minRows;
  }

  const padding = 40;
  const titleHeight = 50;
  const width = cols * cfg.cellSize + padding * 2;
  const height = rowCount * cfg.cellSize + padding * 2 + titleHeight;

  return { cols, rowCount, width, height, chars };
}

function cellPosition(
  index: number,
  cfg: CopybookRenderConfig,
  layoutCols: number,
  perColumnRows: number,
): { row: number; col: number } {
  if (cfg.direction === "vertical") {
    return {
      col: layoutCols - 1 - Math.floor(index / perColumnRows),
      row: index % perColumnRows,
    };
  }
  return {
    row: Math.floor(index / cfg.cols),
    col: index % cfg.cols,
  };
}

/** 在 Canvas 上绘制完整字帖 */
export function renderCopybookCanvas(cfg: CopybookRenderConfig): HTMLCanvasElement {
  const { cols, rowCount, width, height, chars } = computeLayout(cfg);
  const padding = 40;
  const titleHeight = 50;
  const fontSize = Math.floor(cfg.cellSize * 0.75);
  const fontFamily = canvasFontFamily(cfg.fontChoice);
  const perColumnRows = cfg.maxRows ?? cfg.cols;
  const missingSet = new Set(cfg.missingChars);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = PAPER_BG;
  ctx.fillRect(0, 0, width, height);

  // 标题区
  ctx.font = `22px ${fontFamily}`;
  ctx.fillStyle = TITLE_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  const gridLabel = GRID_LABELS[cfg.gridType] ?? "";
  const fontLabel = FONT_LABELS[cfg.fontChoice] ?? "";
  ctx.fillText(`${cfg.title} · ${fontLabel} · ${gridLabel}`, padding, 36);
  if (cfg.subtitle) {
    ctx.font = "12px 'Noto Serif SC', sans-serif";
    ctx.fillStyle = "#8a7560";
    ctx.fillText(cfg.subtitle, padding, 52);
  }

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = modeFillStyle(cfg.mode);

  chars.forEach((char, i) => {
    const { row, col } = cellPosition(i, cfg, cols, perColumnRows);
    const x = padding + col * cfg.cellSize;
    const y = padding + titleHeight + row * cfg.cellSize;
    drawGridCell(ctx, x, y, cfg.cellSize, cfg.gridType);

    if (missingSet.has(char)) {
      drawMissingPlaceholder(ctx, x, y, cfg.cellSize);
    } else {
      ctx.fillText(char, x + cfg.cellSize / 2, y + cfg.cellSize / 2 + 2);
    }
  });

  const totalCells = cols * rowCount;
  for (let i = chars.length; i < totalCells; i++) {
    const { row, col } = cellPosition(i, cfg, cols, perColumnRows);
    const x = padding + col * cfg.cellSize;
    const y = padding + titleHeight + row * cfg.cellSize;
    drawGridCell(ctx, x, y, cfg.cellSize, cfg.gridType);
  }

  return canvas;
}
```

- [ ] **Step 4: Update existing tests for new types**

The existing tests reference `CopybookRenderConfig` without `missingChars`. Update `tests/copybook/grid-renderer.test.ts`:

```typescript
/**
 * 抄经格子渲染测试
 * @author jingxin
 */
import { describe, expect, it } from "vitest";
import {
  computeLayout,
  modeFillStyle,
  canvasFontFamily,
  FONT_LABELS,
  type CopybookRenderConfig,
} from "@/components/copybook/grid-renderer";

const baseConfig: CopybookRenderConfig = {
  text: "观自在菩萨",
  title: "心经",
  cols: 4,
  cellSize: 70,
  maxRows: 8,
  gridType: "mi",
  mode: "normal",
  direction: "horizontal",
  fontChoice: "xuandong",
  missingChars: [],
};

describe("modeFillStyle", () => {
  it("正常模式为深色", () => {
    expect(modeFillStyle("normal")).toBe("#1a1008");
  });

  it("描红模式为半透明红", () => {
    expect(modeFillStyle("miaohong")).toBe("rgba(180, 40, 30, 0.20)");
  });

  it("临摹模式为浅灰", () => {
    expect(modeFillStyle("linmo")).toBe("rgba(0, 0, 0, 0.10)");
  });
});

describe("computeLayout", () => {
  it("横排按列数计算行数", () => {
    const layout = computeLayout({ ...baseConfig, text: "一二三四五六", cols: 4 });
    expect(layout.chars).toHaveLength(6);
    expect(layout.cols).toBe(4);
    expect(layout.rowCount).toBeGreaterThanOrEqual(2);
  });

  it("竖排按 maxRows 计算列数", () => {
    const layout = computeLayout({
      ...baseConfig,
      text: "一二三四五六七八",
      direction: "vertical",
      cols: 4,
      maxRows: 4,
    });
    expect(layout.rowCount).toBe(4);
    expect(layout.cols).toBe(2);
  });

  it("canvas 尺寸含 padding 与标题区", () => {
    const layout = computeLayout(baseConfig);
    expect(layout.width).toBe(4 * 70 + 80);
    expect(layout.height).toBe(layout.rowCount * 70 + 80 + 50);
  });
});

describe("canvasFontFamily", () => {
  it("玄冬楷书返回正确 family", () => {
    expect(canvasFontFamily("xuandong")).toContain("XuandongKai");
  });

  it("青柳隶书返回正确 family", () => {
    expect(canvasFontFamily("aoyagi")).toContain("AoyagiLishu");
  });

  it("齐伋体返回正确 family", () => {
    expect(canvasFontFamily("qiji")).toContain("Qiji");
  });
});

describe("FONT_LABELS", () => {
  it("包含 3 种字体", () => {
    expect(Object.keys(FONT_LABELS)).toHaveLength(3);
    expect(FONT_LABELS["xuandong"]).toBe("玄冬楷书");
    expect(FONT_LABELS["aoyagi"]).toBe("青柳隶书");
    expect(FONT_LABELS["qiji"]).toBe("齐伋体");
  });
});
```

- [ ] **Step 5: Run all tests**

Run: `npx vitest run tests/copybook/ 2>&1 | tail -15`
Expected: All tests pass

- [ ] **Step 6: Verify build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors

- [ ] **Step 7: Commit**

```bash
git add components/copybook/grid-renderer.ts tests/copybook/grid-renderer.test.ts
git commit -m "feat: multi-font support and missing char placeholder in canvas renderer"
```

---

### Task 6: 更新 CopybookConfig 组件

**Files:**
- Modify: `components/copybook/copybook-config.tsx` — 字体下拉增加选项、底部显示覆盖率信息

- [ ] **Step 1: Update font select dropdown**

In `components/copybook/copybook-config.tsx`, find the font select (around line 145-156) and update:

```typescript
        <Field label="字体">
          <select
            className="w-full rounded-lg border border-[var(--jx-border)] px-3 py-2 text-sm"
            value={settings.fontChoice}
            onChange={(e) =>
              onChange({ ...settings, fontChoice: e.target.value as CopybookFontChoice })
            }
          >
            <option value="xuandong">玄冬楷书（6775字）</option>
            <option value="aoyagi">青柳隶书（12204字）</option>
            <option value="qiji">齐伋体（5856字）</option>
          </select>
        </Field>
```

- [ ] **Step 2: Add coverage info at the bottom**

Add import and coverage display before the closing `</div>` of the config component (after line 236, before the `isCustom` block's closing):

```typescript
import { checkCoverage, coveragePercent } from "@/components/copybook/char-coverage";
import { FONT_LABELS } from "@/components/copybook/grid-renderer";
```

Then add this section after the custom row block (around line 237):

```typescript
      {/* 覆盖率信息 */}
      <div className="mt-4 rounded-lg border border-[var(--jx-border)] bg-[var(--jx-paper-deep)] p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--jx-muted-label)]">
            {FONT_LABELS[settings.fontChoice]} 字库覆盖
          </span>
          {processedText && (
            <span
              className={`font-medium ${
                coveragePercent(checkCoverage(processedText, settings.fontChoice)) >= 90
                  ? "text-green-700"
                  : "text-amber-700"
              }`}
            >
              {coveragePercent(checkCoverage(processedText, settings.fontChoice))}%
            </span>
          )}
        </div>
        {processedText && (() => {
          const cov = checkCoverage(processedText, settings.fontChoice);
          return (
            <>
              <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--jx-border)]">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    coveragePercent(cov) >= 90 ? "bg-green-600" : "bg-amber-600"
                  }`}
                  style={{ width: `${coveragePercent(cov)}%` }}
                />
              </div>
              {cov.missing.length > 0 && cov.missing.length <= 30 && (
                <p className="mt-2 text-xs text-[var(--jx-muted-label)]">
                  缺失 {cov.missing.length} 字：
                  <span className="font-mono">{cov.missing.join(" ")}</span>
                </p>
              )}
              {cov.missing.length > 30 && (
                <p className="mt-2 text-xs text-[var(--jx-muted-label)]">
                  缺失 {cov.missing.length} 字（超出显示上限）
                </p>
              )}
            </>
          );
        })()}
      </div>
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/copybook/copybook-config.tsx
git commit -m "feat: font select with 3 options and coverage info panel"
```

---

### Task 7: 更新 buildRenderConfig 计算 missingChars

**Files:**
- Modify: `components/copybook/copybook-config.tsx` — `buildRenderConfig` 函数增加 missingChars 计算

- [ ] **Step 1: Update buildRenderConfig**

Update the `buildRenderConfig` function to compute missingChars:

```typescript
import { COPYBOOK_CHAR_SETS } from "@/lib/copybook/char-sets";

// In buildRenderConfig, after computing finalText:
export function buildRenderConfig(
  sutraTitle: string,
  subtitle: string | undefined,
  settings: CopybookSettings,
  text: string,
): CopybookRenderConfig | null {
  const han = extractHanChars(text);
  if (!han) return null;
  const { text: finalText } = truncateHan(han);
  const preset = PAPER_PRESETS.find((p) => p.id === settings.paperPresetId) ?? PAPER_PRESETS[1];
  const cols = settings.paperPresetId === "custom" ? settings.customCols : preset.cols;
  const maxRows =
    settings.paperPresetId === "custom" ? settings.customMaxRows : preset.maxRows;
  const cellSize =
    settings.paperPresetId === "custom" ? settings.customCellSize : preset.cellSize;

  // 计算缺失字符
  const charSet = COPYBOOK_CHAR_SETS[settings.fontChoice];
  const missingChars = charSet
    ? [...finalText].filter((c) => c.trim() && !charSet.has(c))
    : [...finalText].filter((c) => c.trim());

  return {
    text: finalText,
    title: sutraTitle,
    subtitle,
    cols,
    cellSize,
    maxRows,
    gridType: settings.gridType,
    mode: settings.mode,
    direction: settings.direction,
    fontChoice: settings.fontChoice,
    missingChars,
  };
}
```

- [ ] **Step 2: Add import for CopybookFontChoice from grid-renderer**

Update the import in `copybook-config.tsx`:

```typescript
import {
  GRID_LABELS,
  PAPER_PRESETS,
  FONT_LABELS,
  type CopybookDirection,
  type CopybookFontChoice,
  type CopybookRenderConfig,
  type GridType,
  type WriteMode,
} from "@/components/copybook/grid-renderer";
```

- [ ] **Step 3: Verify build**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add components/copybook/copybook-config.tsx
git commit -m "feat: compute missingChars in buildRenderConfig"
```

---

### Task 8: 运行全部测试并验证

**Files:**
- All copybook tests

- [ ] **Step 1: Run all copybook tests**

Run: `npx vitest run tests/copybook/ 2>&1`
Expected: All tests pass

- [ ] **Step 2: Verify TypeScript build**

Run: `npx tsc --noEmit 2>&1`
Expected: no errors

- [ ] **Step 3: Run dev server to verify visually (optional but recommended)**

Run: `npm run dev &` then open http://localhost:3000/sutra/xinjing/copybook
Expected: Font selector shows 3 options, coverage bar shows percentage, missing chars display placeholders

- [ ] **Step 4: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: copybook enhancement complete - multi-font, coverage check, placeholders"
```

---
