import QRCode from "qrcode";

/**
 * @deprecated 请使用 ShareCardExport + exportShareCardImage() 实现 WYSIWYG 导出
 */

export interface ShareCardConfig {
  title: string;
  subtitle?: string;
  text: string;
  source: string;
  footer?: string;
  shareUrl?: string;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
}

const DEFAULT_BG = "#f7f4ef";
const DEFAULT_TEXT = "#1c1917";
const DEFAULT_ACCENT = "#b45309";

/**
 * 生成经文分享卡片 Canvas
 */
export async function generateShareCardCanvas(
  config: ShareCardConfig
): Promise<HTMLCanvasElement> {
  const {
    title,
    subtitle,
    text,
    source,
    footer = "jingxin",
    shareUrl,
    backgroundColor = DEFAULT_BG,
    textColor = DEFAULT_TEXT,
    accentColor = DEFAULT_ACCENT,
  } = config;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("无法获取 Canvas 上下文");

  const dpr = 2;
  const width = 540;
  const padding = 40;
  const innerWidth = width - padding * 2;

  // 计算高度
  ctx.font = "24px serif";
  const titleHeight = 34;
  const subtitleHeight = subtitle ? 22 : 0;
  const spacing = 16;
  const dividerHeight = 2;

  // 文字换行
  ctx.font = "18px serif";
  const lines: string[] = [];
  const chars = Array.from(text);
  let currentLine = "";
  for (const char of chars) {
    const testLine = currentLine + char;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > innerWidth && currentLine) {
      lines.push(currentLine);
      currentLine = char;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);

  const lineHeight = 28;
  const textBlockHeight = lines.length * lineHeight;

  const sourceHeight = 18;
  const footerHeight = 16;
  const qrSize = shareUrl ? 80 : 0;
  const qrSpacing = 12;

  const contentHeight =
    titleHeight +
    spacing +
    subtitleHeight +
    (subtitle ? spacing : 0) +
    dividerHeight +
    spacing +
    textBlockHeight +
    spacing +
    sourceHeight +
    (footer ? spacing : 0) +
    footerHeight;

  const qrBlockHeight = shareUrl ? Math.max(qrSize, contentHeight) : 0;
  const totalHeight =
    Math.max(contentHeight, qrBlockHeight) + padding * 2;

  canvas.width = width * dpr;
  canvas.height = totalHeight * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${totalHeight}px`;
  ctx.scale(dpr, dpr);

  // 背景
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, totalHeight);

  // 顶部装饰线
  ctx.fillStyle = accentColor;
  ctx.fillRect(padding, padding, innerWidth, 3);

  let y = padding + 16;

  // 标题
  ctx.fillStyle = textColor;
  ctx.font = "bold 24px serif";
  ctx.fillText(title, padding, y);
  y += titleHeight;

  // 副标题
  if (subtitle) {
    ctx.font = "14px serif";
    ctx.fillStyle = "#78716c";
    ctx.fillText(subtitle, padding, y);
    y += subtitleHeight + spacing;
  } else {
    y += spacing;
  }

  // 分隔线
  ctx.fillStyle = accentColor;
  ctx.fillRect(padding, y, innerWidth, dividerHeight);
  y += dividerHeight + spacing;

  // 经文正文
  ctx.fillStyle = textColor;
  ctx.font = "18px serif";
  for (const line of lines) {
    ctx.fillText(line, padding, y);
    y += lineHeight;
  }

  y += spacing;

  // 出处
  ctx.fillStyle = "#78716c";
  ctx.font = "italic 14px serif";
  ctx.fillText(source, padding, y);
  y += sourceHeight;

  // 底部
  if (footer) {
    y += spacing;
    ctx.fillStyle = accentColor;
    ctx.font = "12px serif";
    ctx.fillText(footer, padding, y);
  }

  // 二维码
  if (shareUrl) {
    const qrX = width - padding - qrSize;
    const qrY = padding + 16;

    try {
      const qrDataUrl = await QRCode.toDataURL(shareUrl, {
        width: qrSize * dpr,
        margin: 1,
        color: {
          dark: textColor,
          light: backgroundColor,
        },
      });
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = qrDataUrl;
      });
      ctx.drawImage(img, qrX, qrY, qrSize, qrSize);
    } catch {
      // 二维码生成失败时跳过
    }
  }

  return canvas;
}

/** 下载 Canvas 为 PNG */
export function downloadCanvasAsPNG(canvas: HTMLCanvasElement, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
