/**
 * 站点品牌配置
 * @author 代长亚
 */
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_SITE_BRAND, getPublicBrandName, getSiteBrand } from "@/lib/site-config";

const ENV_KEYS = [
  "SITE_BRAND_NAME",
  "SITE_BRAND_SLUG",
  "SITE_BRAND_TAGLINE",
  "SITE_BRAND_ICON_CHAR",
  "NEXT_PUBLIC_SITE_BRAND_NAME",
] as const;

function clearBrandEnv() {
  for (const key of ENV_KEYS) {
    delete process.env[key];
  }
}

describe("site-config", () => {
  afterEach(() => {
    clearBrandEnv();
  });

  it("uses default brand values", () => {
    expect(getSiteBrand()).toEqual({
      brandName: "正信•经藏",
      brandSlug: "zhengxin-jingzang",
      brandTagline: "让佛经更容易读懂",
      brandIconChar: "正",
    });
  });

  it("allows env overrides", () => {
    process.env.SITE_BRAND_NAME = "测试站点";
    process.env.SITE_BRAND_SLUG = "test-site";
    process.env.SITE_BRAND_TAGLINE = "测试标语";
    process.env.SITE_BRAND_ICON_CHAR = "测";

    expect(getSiteBrand()).toEqual({
      brandName: "测试站点",
      brandSlug: "test-site",
      brandTagline: "测试标语",
      brandIconChar: "测",
    });
  });

  it("rejects invalid brand slug", () => {
    process.env.SITE_BRAND_SLUG = "Bad_Slug!";
    expect(() => getSiteBrand()).toThrow(/Invalid SITE_BRAND_SLUG/);
  });

  it("derives icon char from brand name when unset", () => {
    process.env.SITE_BRAND_NAME = "妙法";
    delete process.env.SITE_BRAND_ICON_CHAR;

    expect(getSiteBrand().brandIconChar).toBe("妙");
  });

  it("exposes public brand name with NEXT_PUBLIC override", () => {
    process.env.NEXT_PUBLIC_SITE_BRAND_NAME = "公开名";
    expect(getPublicBrandName()).toBe("公开名");
  });

  it("falls back to default public brand name", () => {
    expect(getPublicBrandName()).toBe(DEFAULT_SITE_BRAND.brandName);
  });
});
