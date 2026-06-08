/**
 * 站点品牌常量（用户可见文案）
 * @author jingxin
 */
export const BRAND_NAME_EN = "JINGXIN";
export const BRAND_NAME_ZH = "静心";
export const BRAND_TAGLINE = "让佛经更容易读懂";

export function brandHeroLabel(): string {
  return `${BRAND_NAME_EN} · ${BRAND_NAME_ZH}`;
}

export function brandFooterLabel(): string {
  return `${BRAND_NAME_EN} · ${BRAND_NAME_ZH}`;
}

export function brandInlineLabel(): string {
  return `${BRAND_NAME_ZH} · ${BRAND_NAME_EN}`;
}

export function brandPageTitle(): string {
  return `${BRAND_NAME_ZH} ${BRAND_NAME_EN} — ${BRAND_TAGLINE}`;
}

export function brandAboutIntro(): string {
  return `${BRAND_NAME_ZH}（${BRAND_NAME_EN}）是一个现代化的佛经阅读与理解平台，帮助普通读者与初学者更容易读懂经典，而非替代专业佛学研究或法师开示。`;
}

export function brandOgSubtitle(): string {
  return `${BRAND_NAME_EN} — ${BRAND_TAGLINE}`;
}

export function brandShareAttribution(): string {
  return `via ${BRAND_NAME_EN}`;
}

export function brandShareFilename(shareCode: string): string {
  return `${BRAND_NAME_EN}-share-${shareCode}.png`;
}

export function brandAiSystemRole(): string {
  return `你是 ${BRAND_NAME_EN} ${BRAND_NAME_ZH}佛经阅读助手的 AI 对话伙伴。`;
}
