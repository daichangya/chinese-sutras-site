/**
 * 站点图标生成（favicon / apple-touch-icon）
 * @author jingxin
 */
import type { ReactNode } from "react";

/** 纸色、朱砂、边框 — 与 globals.css 设计 token 一致 */
export const BRAND_ICON_COLORS = {
  paper: "#f8f5ef",
  cinnabar: "#8b2500",
  border: "#d9d0c1",
  gold: "#b08d57",
} as const;

const NOTO_SERIF_SC_WOFF =
  "https://cdn.jsdelivr.net/fontsource/fonts/noto-serif-sc@5.2.5/chinese-simplified-600-normal.woff";

let fontCache: ArrayBuffer | null = null;

/** 加载 Noto Serif SC，供 ImageResponse 渲染「静」字 */
export async function loadBrandIconFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const res = await fetch(NOTO_SERIF_SC_WOFF);
  if (!res.ok) {
    throw new Error(`Failed to load brand icon font: ${res.status}`);
  }
  fontCache = await res.arrayBuffer();
  return fontCache;
}

type BrandIconImageProps = {
  size: number;
};

/** ImageResponse 内联 JSX */
export function BrandIconImage({ size }: BrandIconImageProps): ReactNode {
  const radius = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.56);
  const border = Math.max(1, Math.round(size / 32));
  const accentSize = Math.max(2, Math.round(size * 0.06));
  const accentOffset = Math.round(size * 0.12);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        background: BRAND_ICON_COLORS.paper,
        borderRadius: radius,
        border: `${border}px solid ${BRAND_ICON_COLORS.border}`,
        color: BRAND_ICON_COLORS.cinnabar,
        fontSize,
        fontFamily: "Noto Serif SC",
        fontWeight: 600,
        lineHeight: 1,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: accentOffset,
          right: accentOffset,
          width: accentSize,
          height: accentSize,
          borderRadius: accentSize,
          background: BRAND_ICON_COLORS.gold,
        }}
      />
      静
    </div>
  );
}

export async function brandIconImageOptions(size: number) {
  return {
    width: size,
    height: size,
    fonts: [
      {
        name: "Noto Serif SC",
        data: await loadBrandIconFont(),
        style: "normal" as const,
        weight: 600 as const,
      },
    ],
  };
}
