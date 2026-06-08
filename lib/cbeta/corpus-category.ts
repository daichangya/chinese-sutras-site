/**
 * 语料库顶层分类（统一部类，不再混用「大正藏」与「般若部」）
 * 分类规则对齐 CBETA 部类目录 + 用户给定 23 类
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { seriesCodeFromCbetaId, CBETA_SERIES_LABELS } from "./series-label";
import { getBuleiCategory, resetBuleiCatalogCache } from "./bulei-catalog";
/** 语料顶层目录名（与产品分类一致） */
export const CORPUS_CATEGORIES = [
  "宗教（总类 / 总论）",
  "净土宗",
  "禅宗",
  "瑜伽（唯识宗 / 法相宗）",
  "中观（三论宗）",
  "论集（杂论、通论）",
  "史传（僧传、寺志、编年史料）",
  "密教（真言宗、陀罗尼、仪轨）",
  "经集（零散大乘经典）",
  "律部（戒律、僧制）",
  "毗昙（小乘论说）",
  "新编（新增及近现代文献）",
  "事汇（类书、辞典、法数典籍）",
  "敦煌写本（敦煌出土古写经）",
  "华严",
  "宝积",
  "涅槃",
  "法华",
  "般若",
  "大集",
  "本缘（佛本生、本事相关）",
  "阿含（小乘根本经典）",
  "国图善本（扩展类目）",
] as const;

export type CorpusCategory = (typeof CORPUS_CATEGORIES)[number];

/** sch 段名未映射时的索引构建占位（不得作为经目最终归类） */
const SCH_UNKNOWN_SECTION_CATEGORY: CorpusCategory = "论集（杂论、通论）";

/** 非近现代、无规则命中时的经目兜底 */
const UNKNOWN_CORPUS_FALLBACK: CorpusCategory = "宗教（总类 / 总论）";

const XINBIAN_CATEGORY: CorpusCategory = "新编（新增及近现代文献）";

/** 语料目录名：避免 `/` 被 OS 当作路径分隔符 */
export function corpusDirName(category: CorpusCategory | string): string {
  return category.replace(/\s*\/\s*/g, "／");
}

/** 顶层目录是否为 CBETA 藏代码（YP、ZW、ZS 等），而非 23 类中文目录 */
export function isSeriesCodeCorpusDir(dirName: string): boolean {
  const key = dirName.trim().toUpperCase();
  return key in CBETA_SERIES_LABELS && seriesCodeFromCbetaId(`${key}01n0001`) === key;
}

/** 由磁盘部类目录名还原逻辑类名（含拆层后的旧目录片段） */
export function categoryFromCorpusDir(dirName: string): CorpusCategory | null {
  const normalized = dirName.replace(/\s*／\s*/g, "／").replace(/\s*\/\s*/g, "／");
  for (const c of CORPUS_CATEGORIES) {
    if (corpusDirName(c) === normalized || c === dirName || c === normalized) return c;
  }
  const partial = CORPUS_CATEGORIES.find(
    (c) => normalized.startsWith(corpusDirName(c).slice(0, 4)) || corpusDirName(c).startsWith(normalized),
  );
  return partial ?? null;
}

/** 大正藏 sutra_sch.lst 部名 → 语料类名 */
const TAISHO_SECTION_TO_CATEGORY: Record<string, CorpusCategory> = {
  阿含部: "阿含（小乘根本经典）",
  本緣部: "本缘（佛本生、本事相关）",
  本缘部: "本缘（佛本生、本事相关）",
  般若部: "般若",
  法華部: "法华",
  華嚴部: "华严",
  华严部: "华严",
  寶積部: "宝积",
  宝积部: "宝积",
  涅槃部: "涅槃",
  大集部: "大集",
  經集部: "经集（零散大乘经典）",
  经集部: "经集（零散大乘经典）",
  密教部: "密教（真言宗、陀罗尼、仪轨）",
  律部: "律部（戒律、僧制）",
  釋經論部: "论集（杂论、通论）",
  释经论部: "论集（杂论、通论）",
  毘曇部: "毗昙（小乘论说）",
  毗昙部: "毗昙（小乘论说）",
  中觀部: "中观（三论宗）",
  中观部: "中观（三论宗）",
  瑜伽部: "瑜伽（唯识宗 / 法相宗）",
  論集部: "论集（杂论、通论）",
  论集部: "论集（杂论、通论）",
  經疏部: "论集（杂论、通论）",
  经疏部: "论集（杂论、通论）",
  論疏部: "论集（杂论、通论）",
  论疏部: "论集（杂论、通论）",
  諸宗部: "论集（杂论、通论）",
  诸宗部: "论集（杂论、通论）",
  淨土宗: "净土宗",
  净土宗: "净土宗",
  禪宗: "禅宗",
  禅宗: "禅宗",
  史傳部: "史传（僧传、寺志、编年史料）",
  史传部: "史传（僧传、寺志、编年史料）",
  事彙部: "事汇（类书、辞典、法数典籍）",
  事汇部: "事汇（类书、辞典、法数典籍）",
  目錄部: "宗教（总类 / 总论）",
  目录部: "宗教（总类 / 总论）",
  外教部: "宗教（总类 / 总论）",
  古逸部: "敦煌写本（敦煌出土古写经）",
  古逸: "敦煌写本（敦煌出土古写经）",
  疑似部: "敦煌写本（敦煌出土古写经）",
  疑似: "敦煌写本（敦煌出土古写经）",
  悉曇部: "事汇（类书、辞典、法数典籍）",
  悉昙部: "事汇（类书、辞典、法数典籍）",
  圖像部: "密教（真言宗、陀罗尼、仪轨）",
  图像部: "密教（真言宗、陀罗尼、仪轨）",
  續經疏部: "论集（杂论、通论）",
  续经疏部: "论集（杂论、通论）",
  續律疏部: "律部（戒律、僧制）",
  续律疏部: "律部（戒律、僧制）",
  續論疏部: "论集（杂论、通论）",
  续论疏部: "论集（杂论、通论）",
  續諸宗部: "论集（杂论、通论）",
  续诸宗部: "论集（杂论、通论）",
  天台宗: "论集（杂论、通论）",
  華嚴宗: "华严",
  华严宗: "华严",
  律宗: "律部（戒律、僧制）",
  三論宗: "中观（三论宗）",
  三论宗: "中观（三论宗）",
  "三論、惟識宗": "中观（三论宗）",
  "三论、惟识宗": "中观（三论宗）",
  惟識宗: "瑜伽（唯识宗 / 法相宗）",
  唯识宗: "瑜伽（唯识宗 / 法相宗）",
};

/** 始终按藏代码归类的系列（不受 bulei 覆盖） */
const FIXED_SERIES_TO_CATEGORY: Record<string, CorpusCategory> = {
  D: "国图善本（扩展类目）",
  GA: "史传（僧传、寺志、编年史料）",
  GB: "史传（僧传、寺志、编年史料）",
  I: "史传（僧传、寺志、编年史料）",
  ZS: "史传（僧传、寺志、编年史料）",
};

/** 无 bulei/题名命中时的藏代码兜底 */
const SERIES_FALLBACK_CATEGORY: Record<string, CorpusCategory> = {
  N: "阿含（小乘根本经典）",
  B: "新编（新增及近现代文献）",
  ZW: "新编（新增及近现代文献）",
  YP: "新编（新增及近现代文献）",
  TX: "新编（新增及近现代文献）",
  CC: "新编（新增及近现代文献）",
  LC: "新编（新增及近现代文献）",
};

/** 卍续藏 sutra_sch.lst 部名 → 语料类名 */
const XUZANG_SECTION_TO_CATEGORY: Record<string, CorpusCategory> = {
  大小乘釋經部: "论集（杂论、通论）",
  大小乘释经部: "论集（杂论、通论）",
  大小乘釋律部: "律部（戒律、僧制）",
  大小乘释律部: "律部（戒律、僧制）",
  大小乘釋論部: "论集（杂论、通论）",
  大小乘释论部: "论集（杂论、通论）",
  諸宗著述部: "论集（杂论、通论）",
  诸宗著述部: "论集（杂论、通论）",
  "諸宗著述部-禪師語錄": "禅宗",
  "诸宗著述部-禅师语录": "禅宗",
  禮懺部: "宗教（总类 / 总论）",
  礼忏部: "宗教（总类 / 总论）",
  史傳部: "史传（僧传、寺志、编年史料）",
  史传部: "史传（僧传、寺志、编年史料）",
  華嚴經論: "论集（杂论、通论）",
  华严经论: "论集（杂论、通论）",
  華嚴經疏: "论集（杂论、通论）",
  华严经疏: "论集（杂论、通论）",
  圓覺經疏: "论集（杂论、通论）",
  圆觉经疏: "论集（杂论、通论）",
  圓覺經論: "论集（杂论、通论）",
  圆觉经论: "论集（杂论、通论）",
  楞嚴經論: "论集（杂论、通论）",
  楞严经论: "论集（杂论、通论）",
  楞伽經註: "论集（杂论、通论）",
  楞伽经注: "论集（杂论、通论）",
  法華經論: "论集（杂论、通论）",
  法华经论: "论集（杂论、通论）",
  法華經疏: "论集（杂论、通论）",
  法华经疏: "论集（杂论、通论）",
  涅槃經論: "论集（杂论、通论）",
  涅槃经论: "论集（杂论、通论）",
  般若經論: "论集（杂论、通论）",
  般若经论: "论集（杂论、通论）",
  金剛經論: "论集（杂论、通论）",
  金刚经论: "论集（杂论、通论）",
  心經論: "论集（杂论、通论）",
  心经论: "论集（杂论、通论）",
  地藏經論: "论集（杂论、通论）",
  地藏经论: "论集（杂论、通论）",
  彌勒經論: "论集（杂论、通论）",
  弥勒经论: "论集（杂论、通论）",
  無量壽經論: "论集（杂论、通论）",
  无量寿经论: "论集（杂论、通论）",
  觀無量壽經論: "论集（杂论、通论）",
  观无量寿经论: "论集（杂论、通论）",
  阿彌陀經論: "论集（杂论、通论）",
  阿弥陀经论: "论集（杂论、通论）",
  楞伽經疏: "论集（杂论、通论）",
  楞伽经疏: "论集（杂论、通论）",
};

const LUNJI_TITLE_RE =
  /(?:疏|鈔|钞|註|注|釋|義|解|論|發隱|幽贊|會釋|義疏|疏鈔|解義|科文|章義|纂要|合論|別記|别记|釋義|鈔演|直解|略疏|要解|解義|擊節|击节|節錄|节录)/u;

/** 题名主题推断（bulei 未收录的 X/R/Z 等） */
export function categoryFromTitle(title: string): CorpusCategory | null {
  const t = title.trim();
  if (!t) return null;

  if (
    /历章|歷章|法宝录|法寶錄|释教录|釋教錄|总录|總錄|广品|廣品|开元释教|開元釋教|出三藏|目錄|目录/.test(
      t,
    )
  ) {
    return "宗教（总类 / 总论）";
  }

  if (/語錄|语錄|禪燈|禅灯|燈錄|灯录|禪宗|禅宗|拈古|评唱|評唱|語要|宗門|宗门/.test(t)) {
    return "禅宗";
  }
  if (/擊節|击节|節錄|节录/.test(t)) return "论集（杂论、通论）";
  if (/楞嚴|楞严/.test(t) && (LUNJI_TITLE_RE.test(t) || /擊節|击节/.test(t))) {
    return "论集（杂论、通论）";
  }
  if (/圓覺|圆觉/.test(t) && (LUNJI_TITLE_RE.test(t) || /疏|論|论/.test(t))) {
    return "论集（杂论、通论）";
  }
  if (/高僧|僧傳|僧传|年譜|正燈|正灯|統燈|统灯|佛祖統紀|佛祖统纪|釋氏通鑑|释氏通鉴|事略|行狀|塔銘|碑銘/.test(t)) {
    return "史传（僧传、寺志、编年史料）";
  }
  if (
    /阿彌陀|阿弥陀佛|無量壽|无量寿|觀無量壽|观无量寿|淨土|净土|西方要|西方確|往生|地藏|彌勒淨土|弥勒净土/.test(
      t,
    )
  ) {
    return "净土宗";
  }
  if (LUNJI_TITLE_RE.test(t)) return "论集（杂论、通论）";
  if (/華嚴|华严/.test(t)) return "华严";
  if (/法華|法华|妙法蓮華|妙法莲华/.test(t)) return "法华";
  if (/涅槃/.test(t)) return "涅槃";
  if (/寶積|宝积/.test(t)) return "宝积";
  if (/大集/.test(t)) return "大集";
  if (/密教|密宗|真言|陀羅尼|陀罗尼|曼荼羅|曼陀罗|儀軌|仪轨|壇法|坛法|瑜伽教/.test(t)) {
    return "密教（真言宗、陀罗尼、仪轨）";
  }
  if (/律|戒本|羯磨|毘尼|毗尼/.test(t)) return "律部（戒律、僧制）";
  if (/毗曇|毗昙|阿毗達摩|阿毗达摩|俱舍|成實|成实/.test(t)) {
    return "毗昙（小乘论说）";
  }
  if (/瑜伽|唯識|唯识|法相|楞伽|起信/.test(t)) return "瑜伽（唯识宗 / 法相宗）";
  if (/中觀|中观|三論|三论|百論|十二門/.test(t)) return "中观（三论宗）";
  if (/般若|心經|心经|金剛經|金刚经/.test(t)) return "般若";
  if (/阿含|尼迦/.test(t)) return "阿含（小乘根本经典）";
  if (/本緣|本缘|因緣|因缘|本事/.test(t)) return "本缘（佛本生、本事相关）";
  if (/事彙|事汇|法數|法数|辞典|辭典/.test(t)) return "事汇（类书、辞典、法数典籍）";

  return null;
}

let taishoIndex: Map<string, CorpusCategory> | null = null;
let xuzangIndex: Map<string, CorpusCategory> | null = null;
let auxiliaryIndex: Map<string, CorpusCategory> | null = null;

/** sutra_sch 中由 T/X 及固定系列处理的藏，其余走辅助索引 */
const AUX_SCH_SERIES = new Set([
  "A",
  "C",
  "F",
  "G",
  "J",
  "K",
  "L",
  "M",
  "N",
  "P",
  "Q",
  "R",
  "S",
  "U",
  "Y",
  "Z",
]);

/** 印度撰述段：不批量卷域注册，经目靠题名/bulei */
const XUZANG_SKIP_BULK_SECTION = /印度撰述/;

/**
 * 规范为 T01n0001 / T08n0236a / J31nB269（勿对整串 toUpperCase，否则 n 会变成 N）
 * @author 代长亚
 */
export function normalizeCbetaId(cbetaId: string): string {
  const trimmed = cbetaId.trim();
  const numeric = trimmed.match(/^([A-Za-z]+)(\d+)n(\d+)([A-Za-z]?)$/i);
  if (numeric) {
    const [, book, vol, num, suffix] = numeric;
    return `${book!.toUpperCase()}${vol}n${num}${suffix ?? ""}`;
  }
  const letterSutra = trimmed.match(/^([A-Za-z]+)(\d+)n([A-Za-z]\d+)$/i);
  if (letterSutra) {
    const [, book, vol, num] = letterSutra;
    const sutra = num!.length > 1 ? `${num![0]!.toUpperCase()}${num!.slice(1)}` : num!.toUpperCase();
    return `${book!.toUpperCase()}${vol}n${sutra}`;
  }
  return trimmed.toUpperCase();
}

function sutraSchPath(): string {
  return path.join(process.cwd(), "cbeta/static/sutra_sch.lst");
}

function sectionToCategory(section: string): CorpusCategory {
  const key = section.replace(/\s/g, "");
  return (
    TAISHO_SECTION_TO_CATEGORY[key] ??
    TAISHO_SECTION_TO_CATEGORY[section] ??
    SCH_UNKNOWN_SECTION_CATEGORY
  );
}

/** 解析卷域：T05~T08、T44,T45,T46、T86~T97 */
function expandTaishoVolumes(volSpec: string): number[] {
  const spec = volSpec.trim();
  if (spec.includes("~")) {
    const m = spec.match(/T(\d+)~T?(\d+)/i);
    if (!m) return [];
    const start = parseInt(m[1]!, 10);
    const end = parseInt(m[2]!, 10);
    if (end < start) return [];
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  const parts = spec.split(",").map((p) => p.trim());
  const out: number[] = [];
  for (const p of parts) {
    const m = p.match(/T?(\d+)/i);
    if (m) out.push(parseInt(m[1]!, 10));
  }
  return out;
}

/** 解析经号域：0220~0261 */
function expandSutraNums(numSpec: string | undefined): number[] | null {
  if (!numSpec) return null;
  const m = numSpec.match(/(\d+)~(\d+)/);
  if (!m) return null;
  const start = parseInt(m[1]!, 10);
  const end = parseInt(m[2]!, 10);
  if (end < start) return [];
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

function registerTaishoId(
  index: Map<string, CorpusCategory>,
  id: string,
  cat: CorpusCategory,
  overwrite = false,
): void {
  const norm = normalizeCbetaId(id);
  if (overwrite || !index.has(norm)) index.set(norm, cat);
}

function registerTaishoVolumeRange(
  index: Map<string, CorpusCategory>,
  volSpec: string,
  nums: number[] | null,
  cat: CorpusCategory,
  overwrite = false,
): void {
  const vols = expandTaishoVolumes(volSpec);
  if (vols.length === 0) return;
  if (!nums || nums.length === 0) return;
  for (const vol of vols) {
    const volStr = String(vol).padStart(2, "0");
    for (const num of nums) {
      const numStr = String(num).padStart(4, "0");
      registerTaishoId(index, `T${volStr}n${numStr}`, cat, overwrite);
    }
  }
}

/** 解析 cbeta/static/sutra_sch.lst，构建 T* 经目 → 类名索引 */
export function loadTaishoCategoryIndex(schPath = sutraSchPath()): Map<string, CorpusCategory> {
  const index = new Map<string, CorpusCategory>();
  if (!fs.existsSync(schPath)) return index;

  let current: CorpusCategory | null = null;
  const lines = fs.readFileSync(schPath, "utf-8").split(/\r?\n/);

  /** 顶层部类 + 经号域（单 tab）：T05~T08 般若部 0220~0261 */
  const topSectionRe =
    /^\t(?!\t)(T\d+(?:[~,]T?\d+)*)\s+(\S+部)(?:\s+(\d+)~(\d+))?(?:\s|$)/;
  /** 诸宗内子宗（双 tab）：T46 天台宗 1911~1956；T45 三論、惟識宗 1852~1910 */
  const nestedSchoolRe =
    /^\t\t+(T\d+(?:[,]T?\d+)*)\s+(\S+(?:宗|部)?)(?:\s+(\d+)~(\d+))?(?:\s|$)/;
  /** 经目行 T08n0251（排除 JT01n0001 等误匹配） */
  const workRe = /(?<![A-Za-z])T\d{2}n\d{4}[A-Za-z]?/g;

  for (const line of lines) {
    if (line.match(/T\d+n\d/)) {
      if (!current) continue;
      let workMatch: RegExpExecArray | null;
      workRe.lastIndex = 0;
      while ((workMatch = workRe.exec(line)) !== null) {
        registerTaishoId(index, workMatch[0]!, current, true);
      }
      continue;
    }

    const topMatch = line.match(topSectionRe);
    if (topMatch) {
      current = sectionToCategory(topMatch[2]!);
      if (topMatch[3] && topMatch[4]) {
        const nums = expandSutraNums(`${topMatch[3]}~${topMatch[4]}`);
        registerTaishoVolumeRange(index, topMatch[1]!, nums, current);
      }
      continue;
    }

    const nestedMatch = line.match(nestedSchoolRe);
    if (nestedMatch) {
      current = sectionToCategory(nestedMatch[2]!);
      if (nestedMatch[3] && nestedMatch[4]) {
        const nums = expandSutraNums(`${nestedMatch[3]}~${nestedMatch[4]}`);
        registerTaishoVolumeRange(index, nestedMatch[1]!, nums, current, true);
      }
    }
  }

  taishoIndex = index;
  return index;
}

function getTaishoIndex(): Map<string, CorpusCategory> {
  if (!taishoIndex) {
    loadTaishoCategoryIndex();
  }
  return taishoIndex!;
}

/** T 经目 lookup：精确 → 去尾字母（T07n0220k → T07n0220） */
export function lookupTaishoCategory(cbetaId: string): CorpusCategory | undefined {
  const index = getTaishoIndex();
  const id = normalizeCbetaId(cbetaId);

  const exact = index.get(id);
  if (exact) return exact;

  const m = id.match(/^T\d+n\d+([A-Za-z])$/i);
  if (m) {
    const base = id.slice(0, -1);
    const hit = index.get(base);
    if (hit) return hit;
  }
  return undefined;
}

function xuzangSectionToCategory(section: string): CorpusCategory | null {
  const key = section.replace(/\s/g, "");
  if (XUZANG_SKIP_BULK_SECTION.test(key)) return null;
  return XUZANG_SECTION_TO_CATEGORY[key] ?? XUZANG_SECTION_TO_CATEGORY[section] ?? null;
}

/** 解析卷域：X03~X37、X74、X10,X11 */
function expandXuzangVolumes(volSpec: string): number[] {
  const spec = volSpec.trim();
  if (spec.includes("~")) {
    const m = spec.match(/X(\d+)~X?(\d+)/i);
    if (!m) return [];
    const start = parseInt(m[1]!, 10);
    const end = parseInt(m[2]!, 10);
    if (end < start) return [];
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
  const parts = spec.split(",").map((p) => p.trim());
  const out: number[] = [];
  for (const p of parts) {
    const m = p.match(/X?(\d+)/i);
    if (m) out.push(parseInt(m[1]!, 10));
  }
  return out;
}

function registerXuzangId(
  index: Map<string, CorpusCategory>,
  id: string,
  cat: CorpusCategory,
  overwrite = false,
): void {
  const norm = normalizeCbetaId(id);
  if (overwrite || !index.has(norm)) index.set(norm, cat);
}

function registerXuzangVolumeRange(
  index: Map<string, CorpusCategory>,
  volSpec: string,
  nums: number[] | null,
  cat: CorpusCategory,
  overwrite = false,
): void {
  const vols = expandXuzangVolumes(volSpec);
  if (vols.length === 0) return;
  if (!nums || nums.length === 0) return;
  for (const vol of vols) {
    const volStr = String(vol).padStart(2, "0");
    for (const num of nums) {
      const numStr = String(num).padStart(4, "0");
      registerXuzangId(index, `X${volStr}n${numStr}`, cat, overwrite);
    }
  }
}

/** 解析 cbeta/static/sutra_sch.lst 卍续藏段，构建 X* 经目 → 类名索引 */
export function loadXuzangCategoryIndex(schPath = sutraSchPath()): Map<string, CorpusCategory> {
  const index = new Map<string, CorpusCategory>();
  if (!fs.existsSync(schPath)) return index;

  let inXBlock = false;
  let current: CorpusCategory | null = null;
  const lines = fs.readFileSync(schPath, "utf-8").split(/\r?\n/);

  const topSectionRe =
    /^\t(?!\t)(X\d+(?:[~,]X?\d+)*)\s+(\S+)(?:\s+(\d+)~(\d+))?(?:\s|$)/;
  const nestedSectionRe =
    /^\t\t+(X\d+(?:[,~]X?\d+)*)\s+(\S+)(?:\s+(\d+)~(\d+))?(?:\s|$)/;
  const workRe = /(?<![A-Za-z])X\d{2}n\d{4}[A-Za-z]?/g;

  for (const line of lines) {
    if (/^X\s/.test(line)) {
      inXBlock = true;
      continue;
    }
    if (inXBlock && /^[A-Z][A-Za-z]?\s/.test(line) && !line.startsWith("\t")) {
      inXBlock = false;
      current = null;
      continue;
    }
    if (!inXBlock) continue;

    if (line.match(/X\d+n\d/)) {
      if (!current) continue;
      let workMatch: RegExpExecArray | null;
      workRe.lastIndex = 0;
      while ((workMatch = workRe.exec(line)) !== null) {
        registerXuzangId(index, workMatch[0]!, current, true);
      }
      continue;
    }

    const topMatch = line.match(topSectionRe);
    if (topMatch) {
      current = xuzangSectionToCategory(topMatch[2]!);
      if (current && topMatch[3] && topMatch[4]) {
        const nums = expandSutraNums(`${topMatch[3]}~${topMatch[4]}`);
        registerXuzangVolumeRange(index, topMatch[1]!, nums, current);
      }
      continue;
    }

    const nestedMatch = line.match(nestedSectionRe);
    if (nestedMatch) {
      current = xuzangSectionToCategory(nestedMatch[2]!);
      if (current && nestedMatch[3] && nestedMatch[4]) {
        const nums = expandSutraNums(`${nestedMatch[3]}~${nestedMatch[4]}`);
        registerXuzangVolumeRange(index, nestedMatch[1]!, nums, current, true);
      }
    }
  }

  xuzangIndex = index;
  return index;
}

function getXuzangIndex(): Map<string, CorpusCategory> {
  if (!xuzangIndex) {
    loadXuzangCategoryIndex();
  }
  return xuzangIndex!;
}

/** X 经目 lookup：精确 → 去尾字母 */
export function lookupXuzangCategory(cbetaId: string): CorpusCategory | undefined {
  const index = getXuzangIndex();
  const id = normalizeCbetaId(cbetaId);

  const exact = index.get(id);
  if (exact) return exact;

  const m = id.match(/^X\d+n\d+([A-Za-z])$/i);
  if (m) {
    const base = id.slice(0, -1);
    const hit = index.get(base);
    if (hit) return hit;
  }
  return undefined;
}

function extractSchLineTitle(line: string): string | null {
  const m = line.match(/\t*[A-Za-z]{1,2}\d+n[\dA-Za-z]+\s+(.+?)\s*\(\d+卷\)/);
  return m?.[1]?.trim() ?? null;
}

function registerAuxiliaryId(
  index: Map<string, CorpusCategory>,
  id: string,
  cat: CorpusCategory,
  overwrite = false,
): void {
  const norm = normalizeCbetaId(id);
  if (overwrite || !index.has(norm)) index.set(norm, cat);
}

/** 解析 A/C/G/J 等传统藏 sutra_sch 段，构建经目 → 类名索引 */
export function loadAuxiliaryCanonCategoryIndex(
  schPath = sutraSchPath(),
): Map<string, CorpusCategory> {
  const index = new Map<string, CorpusCategory>();
  if (!fs.existsSync(schPath)) return index;

  let activeSeries: string | null = null;
  let current: CorpusCategory | null = null;
  const lines = fs.readFileSync(schPath, "utf-8").split(/\r?\n/);

  const auxHeaderRe = /^([A-Z]{1,2})\s/;
  const auxSubSectionRe = /^\t(?!\t)([A-Z]{1,2}\d+(?:[~,][A-Z]?\d+)*)\s+(\S+)(?:\s+(\d+)~(\d+))?(?:\s|$)/;
  const workRe = /(?<![A-Za-z])[A-Z]{1,2}\d{2,3}n[\dA-Za-z]+/g;

  for (const line of lines) {
    const headerMatch = line.match(auxHeaderRe);
    if (headerMatch && !line.startsWith("\t")) {
      const code = headerMatch[1]!;
      if (code === "T" || code === "X") {
        activeSeries = null;
        current = null;
        continue;
      }
      if (AUX_SCH_SERIES.has(code)) {
        activeSeries = code;
        current = null;
      } else {
        activeSeries = null;
        current = null;
      }
      continue;
    }

    if (!activeSeries) continue;

    if (line.match(/[A-Z]{1,2}\d+n[\dA-Za-z]/i)) {
      const schTitle = extractSchLineTitle(line);
      const cat = current ?? (schTitle ? categoryFromTitle(schTitle) : null);
      if (!cat) continue;
      let workMatch: RegExpExecArray | null;
      workRe.lastIndex = 0;
      while ((workMatch = workRe.exec(line)) !== null) {
        const id = workMatch[0]!;
        if (seriesCodeFromCbetaId(normalizeCbetaId(id)) === activeSeries) {
          registerAuxiliaryId(index, id, cat, true);
        }
      }
      continue;
    }

    const subMatch = line.match(auxSubSectionRe);
    if (subMatch && seriesCodeFromCbetaId(`${subMatch[1]!.slice(0, 2)}01n0001`) === activeSeries) {
      const sectionName = subMatch[2]!;
      current =
        TAISHO_SECTION_TO_CATEGORY[sectionName.replace(/\s/g, "")] ??
        TAISHO_SECTION_TO_CATEGORY[sectionName] ??
        categoryFromTitle(sectionName) ??
        null;
    }
  }

  auxiliaryIndex = index;
  return index;
}

function getAuxiliaryIndex(): Map<string, CorpusCategory> {
  if (!auxiliaryIndex) {
    loadAuxiliaryCanonCategoryIndex();
  }
  return auxiliaryIndex!;
}

/** A/C/G/J 等传统藏经目 lookup */
export function lookupAuxiliaryCanonCategory(cbetaId: string): CorpusCategory | undefined {
  const index = getAuxiliaryIndex();
  const id = normalizeCbetaId(cbetaId);

  const exact = index.get(id);
  if (exact) return exact;

  const m = id.match(/^[A-Z]{1,2}\d+n[\dA-Za-z]+([A-Za-z])$/i);
  if (m) {
    const base = id.slice(0, -1);
    const hit = index.get(base);
    if (hit) return hit;
  }
  return undefined;
}

/** 近现代/研究类语料：仅此类在兜底时归入「新编」 */
export function isModernXinbianCorpus(
  cbetaId: string,
  title?: string,
  translator?: string,
): boolean {
  const series = seriesCodeFromCbetaId(normalizeCbetaId(cbetaId));
  const combined = `${title ?? ""} ${translator ?? ""}`;

  if (series === "YP" || series === "ZW" || series === "B" || series === "TX" || series === "CC" || series === "LC") {
    return true;
  }

  if (series === "X" || series === "F" || series === "T") {
    return false;
  }

  if (
    /民国|民國|太虚|太虛|方广锠|方廣鍠|吕澂|吕潛|演培|法尊|研究|論文|论文|讲记|講記/.test(combined)
  ) {
    return true;
  }

  return false;
}

/** 供测试或热更新：清空缓存 */
export function resetTaishoCategoryIndexCache(): void {
  taishoIndex = null;
  xuzangIndex = null;
  auxiliaryIndex = null;
  resetBuleiCatalogCache();
}

/**
 * 语料顶层目录名（唯一入口）
 * @param title 可选经名，用于部类未收录时的主题推断（X/R/Z 等）
 */
export function canonDeptFromCbetaId(cbetaId: string, title?: string): CorpusCategory {
  const id = normalizeCbetaId(cbetaId);
  const series = seriesCodeFromCbetaId(id);

  if (series && FIXED_SERIES_TO_CATEGORY[series]) {
    return FIXED_SERIES_TO_CATEGORY[series]!;
  }

  if (series === "T") {
    const vol = parseInt(id.match(/^T(\d+)n/i)?.[1] ?? "", 10);
    if (vol === 85) {
      const t85 = lookupTaishoCategory(id);
      if (t85) return t85;
    }
  }

  const buleiCat = getBuleiCategory(id);
  if (buleiCat) return buleiCat;

  if (series === "T") {
    const hit = lookupTaishoCategory(id);
    if (hit) return hit;
  }

  const xSchHit = series === "X" ? lookupXuzangCategory(id) : undefined;
  const auxSchHit =
    series && AUX_SCH_SERIES.has(series) ? lookupAuxiliaryCanonCategory(id) : undefined;

  if (xSchHit) return xSchHit;
  if (auxSchHit) return auxSchHit;

  if (title) {
    const fromTitle = categoryFromTitle(title);
    if (fromTitle) return fromTitle;
  }

  if (series && SERIES_FALLBACK_CATEGORY[series]) {
    return SERIES_FALLBACK_CATEGORY[series]!;
  }

  if (isModernXinbianCorpus(id, title)) {
    return XINBIAN_CATEGORY;
  }

  if (series === "X") {
    return "论集（杂论、通论）";
  }

  return UNKNOWN_CORPUS_FALLBACK;
}
