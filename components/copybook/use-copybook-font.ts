"use client";

/**
 * 抄经多字体按需加载
 * @author 代长亚
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
      // 字体加载失败也允许生成（缺失字走占位符 / Noto 回退）
      setReady(true);
      setFailed(!ok);
    });
  }, [choice]);

  return { ready, failed };
}

export function getFontFamilyForCanvas(choice: CopybookFontChoice): string {
  const config = FONT_CONFIG[choice];
  return `'${config.family}', 'Noto Serif SC', serif`;
}
