/**
 * 站点品牌格式化（基于 site-config）
 * @author 代长亚
 */
import { getSiteBrand } from "@/lib/site-config";

/** 站点作者与仓库 */
export const BRAND_AUTHOR_NAME = "代长亚";
export const BRAND_AUTHOR_EMAIL = "daichangya@163.com";
export const BRAND_REPO_URL = "https://github.com/daichangya/chinese-sutras-site";

/** @deprecated 使用 getBrandName() 或 BRAND_NAME */
export const BRAND_NAME_ZH = "静心";
/** @deprecated 使用 getBrandSlug() 或 BRAND_SLUG */
export const BRAND_NAME_EN = "JINGXIN";

export function getBrandName(): string {
  return getSiteBrand().brandName;
}

export function getBrandSlug(): string {
  return getSiteBrand().brandSlug;
}

export function getBrandTagline(): string {
  return getSiteBrand().brandTagline;
}

export function getBrandIconChar(): string {
  return getSiteBrand().brandIconChar;
}

/** 用户可见站点全名 */
export const BRAND_NAME = getBrandName();
/** 技术用途 slug（分享文件名等） */
export const BRAND_SLUG = getBrandSlug();
export const BRAND_TAGLINE = getBrandTagline();

export function brandHeroLabel(): string {
  return getBrandName();
}

export function brandFooterLabel(): string {
  return getBrandName();
}

export function brandInlineLabel(): string {
  return getBrandName();
}

export function brandPageTitle(): string {
  return `${getBrandName()} — ${getBrandTagline()}`;
}

export function brandPageTitleSuffix(): string {
  return getBrandName();
}

export function brandAboutIntro(): string {
  return `${getBrandName()}是一个现代化的佛经阅读与理解平台，帮助普通读者与初学者更容易读懂经典，而非替代专业佛学研究或法师开示。`;
}

export function brandOgSubtitle(): string {
  return `${getBrandName()} — ${getBrandTagline()}`;
}

export function brandShareAttribution(): string {
  return `via ${getBrandSlug()}`;
}

export function brandShareFilename(shareCode: string): string {
  return `${getBrandSlug()}-share-${shareCode}.png`;
}

export function brandAiSystemRole(): string {
  return `你是 ${getBrandName()} 佛经阅读助手的 AI 对话伙伴。`;
}
