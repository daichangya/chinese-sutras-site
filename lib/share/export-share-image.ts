/**
 * 分享卡片 DOM 截图导出
 * @author 代长亚
 */
import {
  SHARE_CARD_COLORS,
  SHARE_CARD_EXPORT_ID,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "@/lib/share/share-card-tokens";
import { downloadCanvasAsPNG } from "@/lib/share/generate-share-card";

async function waitForFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return;
  await document.fonts.ready;
  const loads = [
    document.fonts.load('400 32px "Noto Serif SC"'),
    document.fonts.load('500 32px "Noto Serif SC"'),
    document.fonts.load('400 12px "Noto Sans SC"'),
  ];
  await Promise.allSettled(loads);
}

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
}

/**
 * 将分享卡片 DOM 导出为 PNG 并触发下载
 */
export async function exportShareCardImage(
  filename: string,
  elementId = SHARE_CARD_EXPORT_ID,
): Promise<HTMLCanvasElement> {
  const source = document.getElementById(elementId);
  if (!source) {
    throw new Error("找不到分享卡片元素");
  }

  await waitForFonts();
  await waitForImages(source);

  const clone = source.cloneNode(true) as HTMLElement;
  clone.id = `${elementId}-export-clone`;
  clone.style.position = "fixed";
  clone.style.left = "-9999px";
  clone.style.top = "0";
  clone.style.width = `${SHARE_CARD_WIDTH}px`;
  clone.style.height = `${SHARE_CARD_HEIGHT}px`;
  clone.style.transform = "none";
  clone.style.margin = "0";
  clone.style.zIndex = "-1";
  document.body.appendChild(clone);

  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(clone, {
      scale: 2,
      width: SHARE_CARD_WIDTH,
      height: SHARE_CARD_HEIGHT,
      backgroundColor: SHARE_CARD_COLORS.paper,
      useCORS: true,
      logging: false,
    });
    downloadCanvasAsPNG(canvas, filename);
    return canvas;
  } finally {
    clone.remove();
  }
}
