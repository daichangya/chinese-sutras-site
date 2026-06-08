/**
 * 抄经字帖 Canvas 格子与文字绘制
 * @author 代长亚
 */
import { resolveGlyph } from "@/components/copybook/font-char-match";
import { COPYBOOK_CHAR_SETS } from "@/lib/copybook/char-sets";

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
  { id: "6x8", label: "6×8 格/页（A4）", cols: 6, maxRows: 8, cellSize: 80 },
  { id: "8x10", label: "8×10 格/页（A4）", cols: 8, maxRows: 10, cellSize: 70 },
  { id: "10x12", label: "10×12 格/页（A4）", cols: 10, maxRows: 12, cellSize: 60 },
  { id: "custom", label: "自定义", cols: 8, maxRows: 10, cellSize: 70 },
] as const;

/** A4 竖版 @ 96dpi，与 jsPDF mm 导出 1:1 对应 */
export const A4_PAGE = {
  widthPx: 794,
  heightPx: 1123,
  widthMm: 210,
  heightMm: 297,
  marginPx: 36,
  titleHeightPx: 56,
} as const;

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

export type LayoutMetrics = {
  cols: number;
  rowCount: number;
  width: number;
  height: number;
  chars: string[];
  cellSize: number;
  gridX: number;
  gridY: number;
  titleHeight: number;
  margin: number;
};

export type CopybookPage = {
  pageIndex: number;
  totalPages: number;
  chars: string[];
  globalStartIndex: number;
};

/** 按每页固定格数拆分正文（横排：cols × maxRows；竖排 Phase 2 同理） */
export function splitIntoPages(cfg: CopybookRenderConfig): CopybookPage[] {
  const allChars = [...cfg.text].filter((c) => c.trim());
  if (allChars.length === 0) {
    return [{ pageIndex: 0, totalPages: 1, chars: [], globalStartIndex: 0 }];
  }

  const rowsPerPage = cfg.maxRows ?? cfg.cols;
  let cellsPerPage: number;

  if (cfg.direction === "vertical") {
    cellsPerPage = cfg.cols * rowsPerPage;
  } else {
    cellsPerPage = cfg.cols * rowsPerPage;
  }

  const pages: CopybookPage[] = [];
  for (let i = 0; i < allChars.length; i += cellsPerPage) {
    pages.push({
      pageIndex: pages.length,
      totalPages: 0,
      chars: allChars.slice(i, i + cellsPerPage),
      globalStartIndex: i,
    });
  }
  const totalPages = pages.length;
  pages.forEach((page) => {
    page.totalPages = totalPages;
  });
  return pages;
}

/** 单页 A4 布局：格子按页内 cols × maxRows 自动放大铺满 */
export function computePageLayout(
  cfg: CopybookRenderConfig,
  pageChars: string[],
): LayoutMetrics {
  const perColumnRows = cfg.maxRows ?? cfg.cols;
  let cols: number;
  let rowCount: number;

  if (cfg.direction === "vertical") {
    rowCount = perColumnRows;
    cols = cfg.cols;
  } else {
    cols = cfg.cols;
    rowCount = cfg.maxRows ?? (Math.ceil(pageChars.length / cols) || 1);
  }

  const { widthPx, heightPx, marginPx, titleHeightPx } = A4_PAGE;
  const gridAreaW = widthPx - marginPx * 2;
  const gridAreaH = heightPx - marginPx * 2 - titleHeightPx;
  const cellSize = Math.floor(Math.min(gridAreaW / cols, gridAreaH / rowCount));

  const gridW = cols * cellSize;
  const gridH = rowCount * cellSize;
  const gridX = marginPx + (gridAreaW - gridW) / 2;
  const gridY = marginPx + titleHeightPx + (gridAreaH - gridH) / 2;

  return {
    cols,
    rowCount,
    width: widthPx,
    height: heightPx,
    chars: pageChars,
    cellSize,
    gridX,
    gridY,
    titleHeight: titleHeightPx,
    margin: marginPx,
  };
}

/** 首页布局（兼容旧测试与调用方） */
export function computeLayout(cfg: CopybookRenderConfig): LayoutMetrics {
  const pages = splitIntoPages(cfg);
  return computePageLayout(cfg, pages[0]?.chars ?? []);
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

function drawPageHeader(
  ctx: CanvasRenderingContext2D,
  cfg: CopybookRenderConfig,
  page: CopybookPage,
  margin: number,
  titleHeight: number,
  fontFamily: string,
): void {
  const gridLabel = GRID_LABELS[cfg.gridType] ?? "";
  const fontLabel = FONT_LABELS[cfg.fontChoice] ?? "";
  const titleSize = Math.max(18, Math.round(titleHeight * 0.38));
  const subSize = Math.max(11, Math.round(titleSize * 0.55));
  const baselineY = margin + titleSize;

  ctx.font = `${titleSize}px ${fontFamily}`;
  ctx.fillStyle = TITLE_COLOR;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  if (page.pageIndex === 0) {
    ctx.fillText(`${cfg.title} · ${fontLabel} · ${gridLabel}`, margin, baselineY);
    if (cfg.subtitle) {
      ctx.font = `${subSize}px 'Noto Serif SC', sans-serif`;
      ctx.fillStyle = "#8a7560";
      ctx.fillText(cfg.subtitle, margin, baselineY + subSize + 4);
    } else if (page.totalPages > 1) {
      ctx.font = `${subSize}px 'Noto Serif SC', sans-serif`;
      ctx.fillStyle = "#8a7560";
      ctx.fillText(`共 ${page.totalPages} 页`, margin, baselineY + subSize + 4);
    }
  } else {
    ctx.fillText(
      `${cfg.title} · 第 ${page.pageIndex + 1} / ${page.totalPages} 页`,
      margin,
      baselineY,
    );
  }
}

/** 绘制单页字帖 */
export function renderCopybookPage(
  cfg: CopybookRenderConfig,
  page: CopybookPage,
): HTMLCanvasElement {
  const layout = computePageLayout(cfg, page.chars);
  const {
    cols,
    rowCount,
    width,
    height,
    chars,
    cellSize,
    gridX,
    gridY,
    titleHeight,
    margin,
  } = layout;
  const fontSize = Math.floor(cellSize * 0.75);
  const fontFamily = canvasFontFamily(cfg.fontChoice);
  const perColumnRows = cfg.maxRows ?? cfg.cols;
  const charSet = COPYBOOK_CHAR_SETS[cfg.fontChoice];

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.fillStyle = PAPER_BG;
  ctx.fillRect(0, 0, width, height);
  drawPageHeader(ctx, cfg, page, margin, titleHeight, fontFamily);

  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = modeFillStyle(cfg.mode);

  chars.forEach((char, i) => {
    const { row, col } = cellPosition(i, cfg, cols, perColumnRows);
    const x = gridX + col * cellSize;
    const y = gridY + row * cellSize;
    drawGridCell(ctx, x, y, cellSize, cfg.gridType);

    const resolved =
      charSet != null
        ? resolveGlyph(char, cfg.fontChoice, charSet)
        : { glyph: char, covered: false };
    ctx.fillText(resolved.glyph, x + cellSize / 2, y + cellSize / 2 + 2);
  });

  const totalCells = cols * rowCount;
  for (let i = chars.length; i < totalCells; i++) {
    const { row, col } = cellPosition(i, cfg, cols, perColumnRows);
    const x = gridX + col * cellSize;
    const y = gridY + row * cellSize;
    drawGridCell(ctx, x, y, cellSize, cfg.gridType);
  }

  return canvas;
}

/** 分页绘制完整字帖，每页固定纸张比例 */
export function renderCopybookPages(cfg: CopybookRenderConfig): HTMLCanvasElement[] {
  return splitIntoPages(cfg).map((page) => renderCopybookPage(cfg, page));
}

/** 仅首页（兼容旧调用） */
export function renderCopybookCanvas(cfg: CopybookRenderConfig): HTMLCanvasElement {
  const pages = splitIntoPages(cfg);
  return renderCopybookPage(cfg, pages[0] ?? {
    pageIndex: 0,
    totalPages: 1,
    chars: [],
    globalStartIndex: 0,
  });
}
