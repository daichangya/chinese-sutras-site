/**
 * 站点品牌配置（默认值 + 可选环境变量覆盖）
 * @author 代长亚
 */

export const DEFAULT_SITE_BRAND = {
  brandName: "正信•经藏",
  brandSlug: "zhengxin-jingzang",
  brandTagline: "让佛经更容易读懂",
  brandIconChar: "正",
} as const;

export type SiteBrandConfig = {
  brandName: string;
  brandSlug: string;
  brandTagline: string;
  brandIconChar: string;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function resolveBrandSlug(raw: string | undefined, brandName: string): string {
  if (raw) {
    if (!SLUG_PATTERN.test(raw)) {
      throw new Error(`Invalid SITE_BRAND_SLUG: must match ${SLUG_PATTERN}`);
    }
    return raw;
  }
  return DEFAULT_SITE_BRAND.brandSlug;
}

function resolveBrandIconChar(raw: string | undefined, brandName: string): string {
  if (raw) {
    return raw;
  }
  const first = [...brandName][0];
  return first || DEFAULT_SITE_BRAND.brandIconChar;
}

/** 读取站点品牌配置（服务端与构建时） */
export function getSiteBrand(): SiteBrandConfig {
  const brandName = readEnv("SITE_BRAND_NAME") ?? DEFAULT_SITE_BRAND.brandName;
  const brandTagline = readEnv("SITE_BRAND_TAGLINE") ?? DEFAULT_SITE_BRAND.brandTagline;
  const brandSlug = resolveBrandSlug(readEnv("SITE_BRAND_SLUG"), brandName);
  const brandIconChar = resolveBrandIconChar(readEnv("SITE_BRAND_ICON_CHAR"), brandName);

  return { brandName, brandSlug, brandTagline, brandIconChar };
}

/** 客户端可见品牌名（NEXT_PUBLIC 优先，否则默认值） */
export function getPublicBrandName(): string {
  return readEnv("NEXT_PUBLIC_SITE_BRAND_NAME") ?? DEFAULT_SITE_BRAND.brandName;
}
