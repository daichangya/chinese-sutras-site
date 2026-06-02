/**
 * 字体加载测试
 * @author jingxin
 */
import { describe, expect, it } from "vitest";
import { FONT_CONFIG } from "@/components/copybook/use-copybook-font";

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

  it("字体 URL 指向 public/fonts/", () => {
    expect(FONT_CONFIG.xuandong.url).toBe("/fonts/xuandong-kaishu.ttf");
    expect(FONT_CONFIG.aoyagi.url).toBe("/fonts/aoyagi-lishu.ttf");
    expect(FONT_CONFIG.qiji.url).toBe("/fonts/qiji.ttf");
  });
});
