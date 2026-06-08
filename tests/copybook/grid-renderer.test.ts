/**
 * 抄经格子渲染测试
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import {
  A4_PAGE,
  computeLayout,
  computePageLayout,
  modeFillStyle,
  canvasFontFamily,
  FONT_LABELS,
  splitIntoPages,
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
    expect(layout.rowCount).toBe(8);
  });

  it("竖排每页固定列数", () => {
    const layout = computeLayout({
      ...baseConfig,
      text: "一二三四五六七八",
      direction: "vertical",
      cols: 4,
      maxRows: 4,
    });
    expect(layout.rowCount).toBe(4);
    expect(layout.cols).toBe(4);
  });

  it("canvas 尺寸为 A4", () => {
    const layout = computeLayout(baseConfig);
    expect(layout.width).toBe(A4_PAGE.widthPx);
    expect(layout.height).toBe(A4_PAGE.heightPx);
  });
});

describe("splitIntoPages", () => {
  it("长文按每页格数分页", () => {
    const cfg: CopybookRenderConfig = {
      ...baseConfig,
      text: "一二三四五六七八九十".repeat(9),
      cols: 4,
      maxRows: 8,
    };
    const pages = splitIntoPages(cfg);
    expect(pages.length).toBeGreaterThan(1);
    expect(pages[0]?.chars.length).toBe(32);
    expect(pages.every((p) => p.totalPages === pages.length)).toBe(true);
  });

  it("单页不足一格时仍有一页", () => {
    const pages = splitIntoPages({ ...baseConfig, text: "观" });
    expect(pages).toHaveLength(1);
    expect(pages[0]?.chars).toEqual(["观"]);
  });
});

describe("computePageLayout", () => {
  it("每页高度固定为 maxRows，字格自动放大铺满 A4", () => {
    const layout = computePageLayout(
      { ...baseConfig, cols: 8, maxRows: 10, cellSize: 70 },
      ["一", "二", "三"],
    );
    expect(layout.rowCount).toBe(10);
    expect(layout.cols).toBe(8);
    expect(layout.width).toBe(A4_PAGE.widthPx);
    expect(layout.height).toBe(A4_PAGE.heightPx);
    expect(layout.cellSize).toBeGreaterThan(70);
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
