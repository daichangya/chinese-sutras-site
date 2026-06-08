/**
 * 白话分层配置（五期单一真相源）
 * @author 代长亚
 */
export type ColloquialTier = "core" | "intro" | "long";

export type ColloquialTierConfig = {
  tier: ColloquialTier;
  /** core: 无限制；intro/long: 每经最多生成段数 */
  maxParagraphs: number | null;
  /** long 仅处理 chapter_seq=0 */
  chapterSeqOnly: number | null;
  /** Vitest 门禁：目标段落集合上的最低覆盖率 */
  minCoverageRatio: number;
};

const CORE_SLUGS = ["xinjing", "jingangjing"] as const;
const INTRO_SLUGS = [
  "amituojing",
  "dizangjing",
  "liuzutanjing",
  "weimojiejing",
  "guanwuliangshoujing",
  "wuliangshoujing",
] as const;
const LONG_SLUGS = ["fahuajing", "liangyanjing", "zhonglun"] as const;

export const TIER_BY_SLUG: Record<string, ColloquialTierConfig> = {};

for (const slug of CORE_SLUGS) {
  TIER_BY_SLUG[slug] = {
    tier: "core",
    maxParagraphs: null,
    chapterSeqOnly: null,
    minCoverageRatio: 0.8,
  };
}

for (const slug of INTRO_SLUGS) {
  TIER_BY_SLUG[slug] = {
    tier: "intro",
    maxParagraphs: 50,
    chapterSeqOnly: null,
    minCoverageRatio: 0.7,
  };
}

for (const slug of LONG_SLUGS) {
  TIER_BY_SLUG[slug] = {
    tier: "long",
    maxParagraphs: 50,
    chapterSeqOnly: 0,
    minCoverageRatio: 0.7,
  };
}

export function getTierForSlug(slug: string): ColloquialTierConfig | undefined {
  return TIER_BY_SLUG[slug];
}

export function listSlugsByTierOrder(): string[] {
  return [...CORE_SLUGS, ...INTRO_SLUGS, ...LONG_SLUGS];
}

export const COLLOQUIAL_SYSTEM_PROMPT = (sutraTitle: string) =>
  `你是佛经白话译者。将用户给出的佛经句子译为通俗现代汉语，保留原意，100字以内。` +
  `禁止扩写、禁止虚构经名或卷号。经名：${sutraTitle}。`;
