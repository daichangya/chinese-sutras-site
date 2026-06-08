/**
 * 品牌常量
 * @author jingxin
 */
import { describe, expect, it } from "vitest";
import {
  BRAND_NAME_EN,
  BRAND_NAME_ZH,
  brandAboutIntro,
  brandFooterLabel,
  brandHeroLabel,
  brandInlineLabel,
  brandOgSubtitle,
  brandPageTitle,
  brandShareAttribution,
  brandShareFilename,
} from "@/lib/brand";

describe("brand constants", () => {
  it("uses uppercase English brand name", () => {
    expect(BRAND_NAME_EN).toBe("JINGXIN");
    expect(BRAND_NAME_ZH).toBe("静心");
  });

  it("formats hero and footer labels", () => {
    expect(brandHeroLabel()).toBe("JINGXIN · 静心");
    expect(brandFooterLabel()).toBe("JINGXIN · 静心");
    expect(brandInlineLabel()).toBe("静心 · JINGXIN");
  });

  it("formats page title and og subtitle", () => {
    expect(brandPageTitle()).toBe("静心 JINGXIN — 让佛经更容易读懂");
    expect(brandOgSubtitle()).toBe("JINGXIN — 让佛经更容易读懂");
  });

  it("formats about intro with uppercase brand", () => {
    expect(brandAboutIntro()).toContain("静心（JINGXIN）");
  });

  it("formats share attribution and filename", () => {
    expect(brandShareAttribution()).toBe("via JINGXIN");
    expect(brandShareFilename("abc12345")).toBe("JINGXIN-share-abc12345.png");
  });
});
