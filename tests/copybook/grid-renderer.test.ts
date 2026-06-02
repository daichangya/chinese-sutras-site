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
