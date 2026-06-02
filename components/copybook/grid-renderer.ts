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
