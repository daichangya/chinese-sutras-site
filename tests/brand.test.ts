/**
 * 品牌常量
 * @author 代长亚
 */
import { describe, expect, it } from "vitest";
import {
  brandAboutIntro,
  brandFooterLabel,
  brandHeroLabel,
  brandInlineLabel,
  brandOgSubtitle,
  brandPageTitle,
  brandPageTitleSuffix,
  brandShareAttribution,
  brandShareFilename,
  getBrandName,
  getBrandSlug,
} from "@/lib/brand";

describe("brand constants", () => {
  it("uses configured brand name and slug", () => {
    expect(getBrandName()).toBe("正信•经藏");
    expect(getBrandSlug()).toBe("zhengxin-jingzang");
  });

  it("formats hero and footer labels", () => {
    expect(brandHeroLabel()).toBe("正信•经藏");
    expect(brandFooterLabel()).toBe("正信•经藏");
    expect(brandInlineLabel()).toBe("正信•经藏");
  });

  it("formats page title and og subtitle", () => {
    expect(brandPageTitle()).toBe("正信•经藏 — 让佛经更容易读懂");
    expect(brandPageTitleSuffix()).toBe("正信•经藏");
    expect(brandOgSubtitle()).toBe("正信•经藏 — 让佛经更容易读懂");
  });

  it("formats about intro with brand name", () => {
    expect(brandAboutIntro()).toContain("正信•经藏");
  });

  it("formats share attribution and filename", () => {
    expect(brandShareAttribution()).toBe("via zhengxin-jingzang");
    expect(brandShareFilename("abc12345")).toBe("zhengxin-jingzang-share-abc12345.png");
  });
});
