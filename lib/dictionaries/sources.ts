/**
 * 汉传核心辞典源清单（DILA + 开放 TSV）
 * @author 代长亚
 */
import type { DictionarySourceMeta } from "./types";

export const DILA_DATA_BASE = "https://glossaries.dila.edu.tw/data";

/** 本地 MDict 导入源（非 DILA 自动下载） */
export const MDICT_SOURCE_CODES = ["foguang"] as const;

/** 批量导入：释义以中文为主的辞典源 */
export const ZH_DILA_SOURCE_CODES = ["dingfubao", "nanshanlu", "nti"] as const;

/** dict:stats 统计范围：中文 DILA + 本地 MDict */
export const CORPUS_DICT_SOURCE_CODES = [...ZH_DILA_SOURCE_CODES, ...MDICT_SOURCE_CODES] as const;

/** 辞典来源展示与排序优先级（高质量源靠前） */
export const SOURCE_SORT_ORDER: string[] = [
  "dingfubao",
  "foguang",
  "nanshanlu",
  "nti",
  "soothill",
  "faxiang",
  "ciyixiao",
  "yinyi",
  "fanfanyu",
  "ahann",
  "suihan",
  "xuyinyi",
  "buddhadatta",
  "pentaglot",
  "mahavyutpatti",
];

const SOURCE_LABEL_OVERRIDES: Record<string, string> = {
  dingfubao: "丁福保佛学大辞典",
  foguang: "佛光大辭典",
  nanshanlu: "南山律学辞典",
  soothill: "中英佛学辞典",
  nti: "NTI 汉英佛学辞典",
  dila: "DILA 佛学辞典",
};

/** 辞典来源中文名 */
export function getDictionarySourceLabel(code: string): string {
  if (SOURCE_LABEL_OVERRIDES[code]) return SOURCE_LABEL_OVERRIDES[code]!;
  const meta = getHanDictionarySource(code);
  if (!meta?.name_zh) return code;
  return meta.name_zh.split("（")[0]!.trim();
}

export function compareDictionarySourceOrder(a: string, b: string): number {
  const ia = SOURCE_SORT_ORDER.indexOf(a);
  const ib = SOURCE_SORT_ORDER.indexOf(b);
  const ra = ia === -1 ? SOURCE_SORT_ORDER.length : ia;
  const rb = ib === -1 ? SOURCE_SORT_ORDER.length : ib;
  if (ra !== rb) return ra - rb;
  return a.localeCompare(b);
}

const ZH_DILA_PARSERS = new Set(["dila-tei-form-def"]);

/** 是否为「仅中文释义」辞典源 */
export function isZhOnlyDictionarySource(meta: DictionarySourceMeta): boolean {
  return ZH_DILA_SOURCE_CODES.includes(meta.code as (typeof ZH_DILA_SOURCE_CODES)[number]);
}

/** `dict:import:all-han` 默认导入的 DILA 源 */
export function getZhDilaImportSources(): DictionarySourceMeta[] {
  return HAN_DICTIONARY_SOURCES.filter(
    (s) => s.zip_filename && ZH_DILA_SOURCE_CODES.includes(s.code as (typeof ZH_DILA_SOURCE_CODES)[number]),
  );
}

/** 汉传核心 ~14 部（含 1 部 TSV 开放数据） */
export const HAN_DICTIONARY_SOURCES: DictionarySourceMeta[] = [
  {
    code: "soothill",
    dir_name: "中英佛学辞典",
    name_zh: "Soothill 中英佛学辞典（headword 中文、释义英文，默认不导入）",
    name_en: "Soothill-Hodous Dictionary of Chinese Buddhist Terms",
    base_url: "https://glossaries.dila.edu.tw/glossaries/SHH",
    license: "CC",
    zip_filename: "soothill-hodous.ddbc.tei.p5.xml.zip",
    parser: "dila-tei-soothill",
    lang: "zh",
  },
  {
    code: "dingfubao",
    dir_name: "丁福保佛学大辞典",
    name_zh: "丁福保佛学大辞典",
    name_en: "Ding Fubao Dictionary of Buddhist Studies",
    base_url: "https://glossaries.dila.edu.tw/glossaries/DFB",
    license: "CC-BY-SA-2.5-TW",
    zip_filename: "dingfubao.dila.tei.p5.xml.zip",
    parser: "dila-tei-form-def",
    lang: "zh",
  },
  {
    code: "foguang",
    dir_name: "佛光大辞典",
    name_zh: "佛光大辭典",
    name_en: "Fo Guang Buddhist Dictionary",
    license: "佛光山版权（增订版 2023.5.1，部署者自用）",
    parser: "mdict",
    lang: "zh",
  },
  {
    code: "nanshanlu",
    dir_name: "南山律学辞典",
    name_zh: "南山律学辞典",
    base_url: "https://glossaries.dila.edu.tw/glossaries/NSL",
    license: "CC-BY-SA",
    zip_filename: "nanshanlu.dila.tei.p5.xml.zip",
    parser: "dila-tei-form-def",
    lang: "zh",
  },
  {
    code: "mahavyutpatti",
    dir_name: "翻译名义大集",
    name_zh: "翻译名义大集",
    base_url: "https://glossaries.dila.edu.tw/glossaries/MVP",
    zip_filename: "mahavyutpatti.dila.tei.p5.xml.zip",
    parser: "dila-tei-mvp",
    lang: "sa",
  },
  {
    code: "pentaglot",
    dir_name: "五体清文鉴",
    name_zh: "五体清文鉴",
    base_url: "https://glossaries.dila.edu.tw/glossaries/PTG",
    zip_filename: "pentaglot.dila.tei.p5.xml.zip",
    parser: "dila-tei-pentaglot",
    lang: "zh",
  },
  {
    code: "buddhadatta",
    dir_name: "巴利语辞典",
    name_zh: "巴利语辞典（达摩比丘中译）",
    base_url: "https://glossaries.dila.edu.tw/glossaries/PLC",
    zip_filename: "pali-chin.dila.tei.p4.xml.zip",
    parser: "dila-tei-form-def",
    lang: "zh",
  },
  {
    code: "nti",
    dir_name: "汉英佛学辞典",
    name_zh: "NTI 汉英佛学辞典",
    name_en: "NTI Buddhist Text Reader Dictionary",
    base_url: "https://ntireader.org",
    license: "CC-BY-SA-3.0",
    parser: "nti-tsv",
    lang: "zh",
  },
  {
    code: "faxiang",
    name_zh: "法相辞典",
    name_en: "Faxiang Dictionary (planned: buddhaspace)",
    parser: "pending-buddhaspace",
    lang: "zh",
  },
  {
    code: "ciyixiao",
    name_zh: "佛学常见词汇",
    parser: "pending-buddhaspace",
    lang: "zh",
  },
  {
    code: "yinyi",
    name_zh: "一切经音义（慧琳音义）",
    parser: "pending-buddhaspace",
    lang: "zh",
  },
  {
    code: "fanfanyu",
    name_zh: "翻梵语",
    parser: "pending-buddhaspace",
    lang: "zh",
  },
  {
    code: "ahann",
    name_zh: "阿含辞典",
    parser: "pending-buddhaspace",
    lang: "zh",
  },
  {
    code: "suihan",
    name_zh: "新集藏经音义随函录",
    parser: "pending-buddhaspace",
    lang: "zh",
  },
  {
    code: "xuyinyi",
    name_zh: "续一切经音义",
    parser: "pending-buddhaspace",
    lang: "zh",
  },
];

export function getHanDictionarySource(code: string): DictionarySourceMeta | undefined {
  return HAN_DICTIONARY_SOURCES.find((s) => s.code === code);
}
