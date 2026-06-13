/**
 * 节日关联经目 slug 注册表（客户端安全，无 DB 依赖）
 * @author 代长亚
 */
export type FestivalSutraRef = {
  /** festivals.yaml 中使用的友好 slug */
  slug: string;
  title: string;
  cbetaId: string;
  /** 限定卷（paragraph.juan_seq，0 = 第一卷） */
  juanSeq?: number;
  /** 首段检索提示（段落 text LIKE） */
  paragraphHint?: string;
};

/** 节日 YAML 经目编码对照表 */
export const FESTIVAL_SUTRA_REGISTRY: Record<string, FestivalSutraRef> = {
  xinjing: {
    slug: "xinjing",
    title: "般若波罗蜜多心经",
    cbetaId: "T08n0251",
  },
  "famen-pin": {
    slug: "famen-pin",
    title: "妙法莲华经观世音菩萨普门品",
    cbetaId: "T09n0262",
    juanSeq: 7,
    paragraphHint: "观世音菩萨",
  },
  "fo-benxing-jing": {
    slug: "fo-benxing-jing",
    title: "佛本行集经",
    cbetaId: "T03n0190",
  },
  "niepan-jing": {
    slug: "niepan-jing",
    title: "大般涅槃经",
    cbetaId: "T12n0374",
  },
  "yulanpen-jing": {
    slug: "yulanpen-jing",
    title: "佛说盂兰盆经",
    cbetaId: "T16n0685",
  },
  "yaoshi-jing": {
    slug: "yaoshi-jing",
    title: "药师琉璃光如来本愿功德经",
    cbetaId: "T14n0450",
  },
  "amituo-jing": {
    slug: "amituo-jing",
    title: "佛说阿弥陀经",
    cbetaId: "T12n0366",
  },
};

export function getFestivalSutraRef(slug: string): FestivalSutraRef | null {
  return FESTIVAL_SUTRA_REGISTRY[slug] ?? null;
}
