/**
 * MVP 导入经目
 * @author 代长亚
 */
export type CanonEntry = {
  slug: string;
  cbetaId: string;
  title: string;
  category: string;
};

export const MVP_CANON: CanonEntry[] = [
  { slug: "xinjing", cbetaId: "T08n0251", title: "般若波羅蜜多心經", category: "般若部" },
  { slug: "jingangjing", cbetaId: "T08n0235", title: "金剛般若波羅蜜經", category: "般若部" },
  { slug: "dizangjing", cbetaId: "T13n0412", title: "地藏菩薩本願經", category: "菩萨部" },
  { slug: "amituojing", cbetaId: "T12n0366", title: "佛說阿彌陀經", category: "净土部" },
  { slug: "fahuajing", cbetaId: "T09n0262", title: "妙法蓮華經", category: "法华部" },
  { slug: "liangyanjing", cbetaId: "T19n0945", title: "大佛頂首楞嚴經", category: "密教部" },
  { slug: "liuzutanjing", cbetaId: "T48n2008", title: "六祖大師法寶壇經", category: "禅宗部" },
  { slug: "weimojiejing", cbetaId: "T14n0475", title: "維摩詰所說經", category: "菩萨部" },
  { slug: "zhonglun", cbetaId: "T30n1564", title: "中論", category: "中观部" },
  { slug: "wuliangshoujing", cbetaId: "T12n0360", title: "佛說無量壽經", category: "净土部" },
  { slug: "guanwuliangshoujing", cbetaId: "T12n0365", title: "佛說觀無量壽佛經", category: "净土部" },
];

const MVP_SLUGS = new Set(MVP_CANON.map((e) => e.slug));
const MVP_CBETA_BY_SLUG = new Map(MVP_CANON.map((e) => [e.slug, e.cbetaId]));
const MVP_SLUG_BY_CBETA = new Map(MVP_CANON.map((e) => [e.cbetaId.toUpperCase(), e.slug]));

/** 是否在 MVP 热门经目列表中（用于首页推荐与友好 slug 映射） */
export function isMvpSutra(slug: string): boolean {
  return MVP_SLUGS.has(slug);
}

/** 友好 slug → CBETA 编号（如 xinjing → T08n0251） */
export function getMvpCbetaIdBySlug(slug: string): string | undefined {
  return MVP_CBETA_BY_SLUG.get(slug);
}

/** CBETA 编号 → MVP 友好 slug（如 T08n0251 → xinjing） */
export function getMvpSlugByCbetaId(cbetaId: string): string | undefined {
  return MVP_SLUG_BY_CBETA.get(cbetaId.toUpperCase());
}
