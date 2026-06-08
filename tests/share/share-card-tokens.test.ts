/**
 * 分享卡片 token 与字号计算测试
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import {
  computeShareExcerptFontSize,
  SHARE_CARD_COLORS,
  SHARE_CARD_EXCERPT_FONT_MAX,
  SHARE_CARD_EXCERPT_FONT_MIN,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_WIDTH,
} from "@/lib/share/share-card-tokens";

describe("share-card-tokens", () => {
  it("uses 4:5 portrait dimensions", () => {
    expect(SHARE_CARD_WIDTH).toBe(1080);
    expect(SHARE_CARD_HEIGHT).toBe(1350);
    expect(SHARE_CARD_HEIGHT / SHARE_CARD_WIDTH).toBe(1.25);
  });

  it("uses cinnabar accent from design system", () => {
    expect(SHARE_CARD_COLORS.cinnabar).toBe("#8b2500");
    expect(SHARE_CARD_COLORS.paper).toBe("#f8f5ef");
    expect(SHARE_CARD_COLORS.inkClassical).toBe("#2b2318");
  });

  it("returns max font size for short excerpts", () => {
    expect(computeShareExcerptFontSize(10)).toBe(SHARE_CARD_EXCERPT_FONT_MAX);
    expect(computeShareExcerptFontSize(40)).toBe(SHARE_CARD_EXCERPT_FONT_MAX);
  });

  it("scales down font size for longer excerpts", () => {
    expect(computeShareExcerptFontSize(50)).toBe(32);
    expect(computeShareExcerptFontSize(100)).toBe(30);
    expect(computeShareExcerptFontSize(150)).toBe(SHARE_CARD_EXCERPT_FONT_MIN);
    expect(computeShareExcerptFontSize(250)).toBe(24);
  });
});
