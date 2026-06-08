/**
 * FoJin 0037/0094 curated seed 数据（宗派、概念、圣地及关系）
 * @author 代长亚
 */
import { toSimplifiedZh } from "@/lib/han/storage-normalize";
import type { KgEntityRecord, KgRelationRecord } from "./types";

type SchoolDef = {
  name_zh: string;
  name_en: string;
  name_sa?: string;
  desc: string;
};

type NamedDef = {
  name_zh: string;
  name_en: string;
  name_sa?: string | null;
  name_pi?: string | null;
  desc: string;
};

/** FoJin 0037 — 12 个宗派 */
export const FOJIN_SCHOOLS: SchoolDef[] = [
  {
    name_zh: "天台宗",
    name_en: "Tiantai",
    name_sa: "Mādhyamaka-Tiantai",
    desc: "以《法华经》为根本经典，智顗所创立的中国佛教宗派",
  },
  {
    name_zh: "华严宗",
    name_en: "Huayan",
    name_sa: "Avataṃsaka",
    desc: "以《华严经》为根本经典，法藏集大成的中国佛教宗派",
  },
  {
    name_zh: "法相宗",
    name_en: "Faxiang (Yogācāra)",
    name_sa: "Yogācāra",
    desc: "玄奘传入中国的唯识学派，以《成唯识论》为核心",
  },
  {
    name_zh: "三论宗",
    name_en: "Sanlun (Mādhyamaka)",
    name_sa: "Mādhyamaka",
    desc: "以龙树《中论》《十二门论》及提婆《百论》为根本的中观学派",
  },
  {
    name_zh: "禅宗",
    name_en: "Chan (Zen)",
    name_sa: "Dhyāna",
    desc: "达摩传入中国的禅修传统，强调不立文字、直指人心",
  },
  {
    name_zh: "净土宗",
    name_en: "Pure Land",
    name_sa: "Sukhāvatī",
    desc: "以念佛往生西方极乐世界为修行核心的宗派",
  },
  {
    name_zh: "律宗",
    name_en: "Vinaya (Lü)",
    name_sa: "Vinaya",
    desc: "专弘戒律的宗派，道宣为中国律宗实际创始人",
  },
  {
    name_zh: "密宗",
    name_en: "Esoteric (Zhenyan)",
    name_sa: "Vajrayāna",
    desc: "以密教经典和修法为核心的宗派，唐代三大士弘传",
  },
  {
    name_zh: "俱舍宗",
    name_en: "Kośa",
    name_sa: "Abhidharmakośa",
    desc: "以世亲《俱舍论》为根本论典的部派佛教学派",
  },
  {
    name_zh: "成实宗",
    name_en: "Chengshi (Satyasiddhi)",
    name_sa: "Satyasiddhi",
    desc: "以诃梨跋摩《成实论》为根本论典的学派",
  },
  {
    name_zh: "涅槃宗",
    name_en: "Nirvāṇa School",
    name_sa: "Nirvāṇa",
    desc: "以《大般涅槃经》为根本经典的早期中国佛教学派",
  },
  {
    name_zh: "摄论宗",
    name_en: "Shelun (Mahāyānasaṃgraha)",
    name_sa: "Mahāyānasaṃgraha",
    desc: "以无著《摄大乘论》为根本论典的学派，真谛所传",
  },
];

/** FoJin 0037 — 宗派归属 */
export const FOJIN_AFFILIATIONS: Array<[string, string]> = [
  ["玄奘", "法相宗"],
  ["窺基", "法相宗"],
  ["吉藏", "三论宗"],
  ["僧肇", "三论宗"],
  ["僧叡", "三论宗"],
  ["道融", "三论宗"],
  ["道生", "三论宗"],
  ["智顗", "天台宗"],
  ["灌頂", "天台宗"],
  ["湛然", "天台宗"],
  ["慧文", "天台宗"],
  ["慧思", "天台宗"],
  ["法藏", "华严宗"],
  ["杜順", "华严宗"],
  ["智儼", "华严宗"],
  ["澄觀", "华严宗"],
  ["宗密", "华严宗"],
  ["菩提達摩", "禅宗"],
  ["慧可", "禅宗"],
  ["僧璨", "禅宗"],
  ["道信", "禅宗"],
  ["弘忍", "禅宗"],
  ["慧能", "禅宗"],
  ["神秀", "禅宗"],
  ["慧遠", "净土宗"],
  ["曇鸞", "净土宗"],
  ["道綽", "净土宗"],
  ["善導", "净土宗"],
  ["道宣", "律宗"],
  ["不空", "密宗"],
  ["善無畏", "密宗"],
  ["金剛智", "密宗"],
  ["道生", "涅槃宗"],
  ["真諦", "摄论宗"],
];

/** FoJin 0037 — 法脉师承 */
export const FOJIN_LINEAGES: Array<[string, string]> = [
  ["菩提達摩", "慧可"],
  ["慧可", "僧璨"],
  ["僧璨", "道信"],
  ["道信", "弘忍"],
  ["弘忍", "慧能"],
  ["弘忍", "神秀"],
  ["慧文", "慧思"],
  ["慧思", "智顗"],
  ["智顗", "灌頂"],
  ["杜順", "智儼"],
  ["智儼", "法藏"],
  ["法藏", "澄觀"],
  ["澄觀", "宗密"],
  ["戒賢", "玄奘"],
  ["玄奘", "窺基"],
  ["鳩摩羅什", "僧肇"],
  ["鳩摩羅什", "僧叡"],
  ["鳩摩羅什", "道融"],
  ["鳩摩羅什", "道生"],
  ["曇鸞", "道綽"],
  ["道綽", "善導"],
  ["善無畏", "不空"],
  ["金剛智", "不空"],
  ["智首", "道宣"],
  ["安世高", "嚴佛調"],
  ["支婁迦讖", "支亮"],
  ["支亮", "支謙"],
  ["灌頂", "智威"],
  ["智威", "慧威"],
  ["慧威", "玄朗"],
  ["玄朗", "湛然"],
  ["宗密", "裴休"],
  ["慧能", "南嶽懷讓"],
  ["慧能", "青原行思"],
  ["南嶽懷讓", "馬祖道一"],
  ["青原行思", "石頭希遷"],
  ["彌勒", "無著"],
  ["無著", "世親"],
  ["世親", "陳那"],
  ["陳那", "護法"],
  ["護法", "戒賢"],
  ["龍樹", "提婆"],
  ["提婆", "羅睺羅"],
];

/** FoJin 0094 — 18 个核心概念 */
export const FOJIN_CONCEPTS: NamedDef[] = [
  {
    name_zh: "缘起",
    name_en: "Dependent Origination",
    name_sa: "Pratītyasamutpāda",
    name_pi: "Paṭiccasamuppāda",
    desc: "佛教核心教义，一切法因缘和合而生，无自性",
  },
  {
    name_zh: "四圣谛",
    name_en: "Four Noble Truths",
    name_sa: "Catvāry āryasatyāni",
    name_pi: "Cattāri ariyasaccāni",
    desc: "苦谛、集谛、灭谛、道谛，佛教最根本的教理框架",
  },
  {
    name_zh: "八正道",
    name_en: "Noble Eightfold Path",
    name_sa: "Āryāṣṭāṅgamārga",
    name_pi: "Ariyo aṭṭhaṅgiko maggo",
    desc: "正见、正思惟、正语、正业、正命、正精进、正念、正定",
  },
  {
    name_zh: "空性",
    name_en: "Emptiness",
    name_sa: "Śūnyatā",
    name_pi: "Suññatā",
    desc: "大乘佛教核心概念，一切法无自性、无实体",
  },
  {
    name_zh: "唯识",
    name_en: "Consciousness-Only",
    name_sa: "Vijñaptimātratā",
    desc: "瑜伽行派核心教义，万法唯识所现",
  },
  {
    name_zh: "佛性",
    name_en: "Buddha-nature",
    name_sa: "Tathāgatagarbha",
    desc: "如来藏思想，一切众生皆具成佛之性",
  },
  {
    name_zh: "般若",
    name_en: "Prajñā (Wisdom)",
    name_sa: "Prajñā",
    name_pi: "Paññā",
    desc: "超越世间智慧的究竟智慧，大乘六波罗蜜之首",
  },
  {
    name_zh: "涅槃",
    name_en: "Nirvāṇa",
    name_sa: "Nirvāṇa",
    name_pi: "Nibbāna",
    desc: "烦恼寂灭、生死解脱的究竟境界",
  },
  {
    name_zh: "菩提",
    name_en: "Bodhi (Awakening)",
    name_sa: "Bodhi",
    name_pi: "Bodhi",
    desc: "觉悟、正觉，佛教修行的终极目标",
  },
  {
    name_zh: "三法印",
    name_en: "Three Marks of Existence",
    name_sa: "Trilakṣaṇa",
    name_pi: "Tilakkhaṇa",
    desc: "诸行无常、诸法无我、涅槃寂静，判断佛法的标准",
  },
  {
    name_zh: "十二因缘",
    name_en: "Twelve Nidānas",
    name_sa: "Dvādaśa-nidāna",
    name_pi: "Dvādasanidāna",
    desc: "无明至老死的十二环节，详细阐释缘起法则",
  },
  {
    name_zh: "六波罗蜜",
    name_en: "Six Pāramitās",
    name_sa: "Ṣaṭ-pāramitā",
    desc: "布施、持戒、忍辱、精进、禅定、般若，菩萨修行的六种德行",
  },
  {
    name_zh: "中道",
    name_en: "Middle Way",
    name_sa: "Madhyamā-pratipad",
    name_pi: "Majjhimā paṭipadā",
    desc: "远离苦行与纵欲两极端的修行路线",
  },
  {
    name_zh: "三学",
    name_en: "Three Trainings",
    name_sa: "Triśikṣā",
    name_pi: "Tisso sikkhā",
    desc: "戒、定、慧，佛教修行的三大纲要",
  },
  {
    name_zh: "五蕴",
    name_en: "Five Aggregates",
    name_sa: "Pañcaskandha",
    name_pi: "Pañcakkhandha",
    desc: "色、受、想、行、识，构成有情众生身心的五种要素",
  },
  {
    name_zh: "禅定",
    name_en: "Dhyāna (Meditation)",
    name_sa: "Dhyāna",
    name_pi: "Jhāna",
    desc: "专注一境的修行方法，佛教核心修行实践",
  },
  {
    name_zh: "业",
    name_en: "Karma",
    name_sa: "Karma",
    name_pi: "Kamma",
    desc: "身口意三业，因果报应的核心概念",
  },
  {
    name_zh: "轮回",
    name_en: "Saṃsāra",
    name_sa: "Saṃsāra",
    name_pi: "Saṃsāra",
    desc: "众生在六道中不断流转的生死循环",
  },
];

/** FoJin 0094 — 25 个 canonical 圣地（与 DILA place 互补） */
export const FOJIN_PLACES: NamedDef[] = [
  {
    name_zh: "菩提伽耶",
    name_en: "Bodh Gaya",
    name_sa: "Bodhgayā",
    desc: "释迦牟尼成道之地，位于今印度比哈尔邦",
  },
  {
    name_zh: "鹿野苑",
    name_en: "Sarnath",
    name_sa: "Ṛṣipatana",
    desc: "释迦牟尼初转法轮之地，位于今印度瓦拉纳西附近",
  },
  {
    name_zh: "王舍城",
    name_en: "Rajgir",
    name_sa: "Rājagṛha",
    desc: "摩揭陀国首都，第一次佛经结集之地",
  },
  {
    name_zh: "舍卫城",
    name_en: "Shravasti",
    name_sa: "Śrāvastī",
    desc: "拘萨罗国首都，祇园精舍所在地，佛陀说法最多之处",
  },
  {
    name_zh: "拘尸那揭罗",
    name_en: "Kushinagar",
    name_sa: "Kuśinagara",
    desc: "释迦牟尼涅槃之地，位于今印度北方邦",
  },
  {
    name_zh: "蓝毗尼",
    name_en: "Lumbini",
    name_sa: "Lumbinī",
    desc: "释迦牟尼诞生之地，位于今尼泊尔",
  },
  {
    name_zh: "那烂陀",
    name_en: "Nalanda",
    name_sa: "Nālandā",
    desc: "古印度最著名的佛教大学，玄奘曾于此学法",
  },
  {
    name_zh: "超戒寺",
    name_en: "Vikramashila",
    name_sa: "Vikramaśīla",
    desc: "波罗王朝时期重要的密教学府",
  },
  {
    name_zh: "吠舍离",
    name_en: "Vaishali",
    name_sa: "Vaiśālī",
    desc: "第二次佛经结集之地，维摩诘居住之处",
  },
  {
    name_zh: "五台山",
    name_en: "Mount Wutai",
    desc: "文殊菩萨道场，中国佛教四大名山之首，位于山西省",
  },
  {
    name_zh: "峨眉山",
    name_en: "Mount Emei",
    desc: "普贤菩萨道场，中国佛教四大名山之一，位于四川省",
  },
  {
    name_zh: "普陀山",
    name_en: "Mount Putuo",
    name_sa: "Potalaka",
    desc: "观世音菩萨道场，中国佛教四大名山之一，位于浙江省",
  },
  {
    name_zh: "九华山",
    name_en: "Mount Jiuhua",
    desc: "地藏菩萨道场，中国佛教四大名山之一，位于安徽省",
  },
  {
    name_zh: "嵩山",
    name_en: "Mount Song",
    desc: "少林寺所在地，禅宗祖庭，位于河南省",
  },
  {
    name_zh: "天台山",
    name_en: "Mount Tiantai",
    desc: "天台宗发祥地，国清寺所在地，位于浙江省",
  },
  {
    name_zh: "庐山",
    name_en: "Mount Lu",
    desc: "东林寺所在地，净土宗发祥地，位于江西省",
  },
  {
    name_zh: "终南山",
    name_en: "Mount Zhongnan",
    desc: "净业寺所在地，律宗祖庭，位于陕西省",
  },
  {
    name_zh: "龟兹",
    name_en: "Kucha",
    name_sa: "Kucīna",
    desc: "古西域佛教中心，鸠摩罗什故乡，位于今新疆库车",
  },
  {
    name_zh: "犍陀罗",
    name_en: "Gandhara",
    name_sa: "Gandhāra",
    desc: "古印度西北部佛教艺术中心，佛像艺术发源地",
  },
  {
    name_zh: "敦煌",
    name_en: "Dunhuang",
    desc: "莫高窟所在地，丝绸之路佛教文化交汇处，位于甘肃省",
  },
  {
    name_zh: "阿努拉德普勒",
    name_en: "Anuradhapura",
    name_sa: "Anurādhapura",
    desc: "斯里兰卡古都，上座部佛教传播中心",
  },
  {
    name_zh: "高野山",
    name_en: "Mount Koya",
    desc: "空海创立的真言宗总本山，位于日本和歌山县",
  },
  {
    name_zh: "比叡山",
    name_en: "Mount Hiei",
    desc: "最澄创立的天台宗总本山，位于日本滋贺县",
  },
  {
    name_zh: "拉萨",
    name_en: "Lhasa",
    desc: "西藏首府，布达拉宫、大昭寺所在地，藏传佛教圣城",
  },
  {
    name_zh: "桑耶寺",
    name_en: "Samye Monastery",
    desc: "西藏第一座佛教寺院，寂护和莲花生大士创建",
  },
];

export const FOJIN_PERSON_PLACE: Array<[string, string]> = [
  ["鳩摩羅什", "龟兹"],
  ["玄奘", "那烂陀"],
  ["菩提達摩", "嵩山"],
  ["智顗", "天台山"],
  ["慧遠", "庐山"],
  ["道宣", "终南山"],
  ["法藏", "五台山"],
];

export const FOJIN_SCHOOL_CONCEPT: Array<[string, string]> = [
  ["三论宗", "空性"],
  ["三论宗", "中道"],
  ["法相宗", "唯识"],
  ["天台宗", "中道"],
  ["禅宗", "禅定"],
  ["禅宗", "菩提"],
  ["净土宗", "涅槃"],
  ["密宗", "禅定"],
  ["华严宗", "缘起"],
];

export const SOURCE_SCHOOL = "seed:school_affiliation";
export const SOURCE_LINEAGE = "seed:lineage";
export const SOURCE_PLACE = "seed:place";
export const SOURCE_CONCEPT = "seed:concept";
export const SOURCE_PERSON_PLACE = "seed:person_place";
export const SOURCE_SCHOOL_CONCEPT = "seed:school_concept";

function seedId(kind: "school" | "concept" | "place" | "person", nameZh: string): string {
  const key = toSimplifiedZh(nameZh);
  return `kg:${kind}:seed:${key}`;
}

function buildPersonIndex(existing: KgEntityRecord[]): Map<string, string> {
  const byName = new Map<string, string[]>();
  for (const e of existing) {
    if (e.entity_type !== "person") continue;
    const key = toSimplifiedZh(e.name_zh);
    const list = byName.get(key) ?? [];
    list.push(e.id);
    byName.set(key, list);
  }
  const pick = (ids: string[]): string => {
    const dila = ids.find((id) => id.includes(":dila:"));
    if (dila) return dila;
    const seed = ids.find((id) => id.includes(":seed:"));
    if (seed) return seed;
    return ids[0]!;
  };
  const out = new Map<string, string>();
  for (const [name, ids] of byName) {
    out.set(name, pick(ids));
  }
  return out;
}

function buildPlaceIndex(existing: KgEntityRecord[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const e of existing) {
    if (e.entity_type !== "place" && e.entity_type !== "monastery") continue;
    out.set(toSimplifiedZh(e.name_zh), e.id);
  }
  return out;
}

function buildSchoolIndex(existing: KgEntityRecord[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const e of existing) {
    if (e.entity_type !== "school") continue;
    out.set(toSimplifiedZh(e.name_zh), e.id);
  }
  return out;
}

function buildConceptIndex(existing: KgEntityRecord[]): Map<string, string> {
  const out = new Map<string, string>();
  for (const e of existing) {
    if (e.entity_type !== "concept") continue;
    out.set(toSimplifiedZh(e.name_zh), e.id);
  }
  return out;
}

function ensurePerson(
  rawName: string,
  personIndex: Map<string, string>,
  entities: KgEntityRecord[],
): string {
  const name = toSimplifiedZh(rawName);
  const existing = personIndex.get(name);
  if (existing) return existing;
  const id = seedId("person", name);
  if (!personIndex.has(name)) {
    entities.push({
      id,
      entity_type: "person",
      name_zh: name,
      properties: { description: "佛教僧侣/学者" },
      source_tier: "authoritative",
      source: SOURCE_LINEAGE,
    });
    personIndex.set(name, id);
  }
  return id;
}

function pushRelation(
  relations: KgRelationRecord[],
  seen: Set<string>,
  rel: KgRelationRecord,
): void {
  const key = `${rel.subject_id}|${rel.predicate}|${rel.object_id}|${rel.source}`;
  if (seen.has(key)) return;
  seen.add(key);
  relations.push(rel);
}

/** 从 FoJin 0037/0094 生成 seed 实体与关系 */
export function buildFojinCuratedSeed(existingEntities: KgEntityRecord[]): {
  entities: KgEntityRecord[];
  relations: KgRelationRecord[];
} {
  const entities: KgEntityRecord[] = [];
  const relations: KgRelationRecord[] = [];
  const relSeen = new Set<string>();

  const personIndex = buildPersonIndex(existingEntities);
  const placeIndex = buildPlaceIndex(existingEntities);
  const schoolIndex = buildSchoolIndex(existingEntities);
  const conceptIndex = buildConceptIndex(existingEntities);

  for (const school of FOJIN_SCHOOLS) {
    const name = toSimplifiedZh(school.name_zh);
    if (schoolIndex.has(name)) continue;
    const id = seedId("school", name);
    entities.push({
      id,
      entity_type: "school",
      name_zh: name,
      name_en: school.name_en,
      properties: {
        description: toSimplifiedZh(school.desc),
        name_sa: school.name_sa,
      },
      source_tier: "authoritative",
      source: SOURCE_SCHOOL,
    });
    schoolIndex.set(name, id);
  }

  for (const concept of FOJIN_CONCEPTS) {
    const name = toSimplifiedZh(concept.name_zh);
    if (conceptIndex.has(name)) continue;
    const id = seedId("concept", name);
    entities.push({
      id,
      entity_type: "concept",
      name_zh: name,
      name_en: concept.name_en,
      properties: {
        description: toSimplifiedZh(concept.desc),
        name_sa: concept.name_sa ?? undefined,
        name_pi: concept.name_pi ?? undefined,
      },
      source_tier: "authoritative",
      source: SOURCE_CONCEPT,
    });
    conceptIndex.set(name, id);
  }

  for (const place of FOJIN_PLACES) {
    const name = toSimplifiedZh(place.name_zh);
    if (placeIndex.has(name)) continue;
    const id = seedId("place", name);
    entities.push({
      id,
      entity_type: "place",
      name_zh: name,
      name_en: place.name_en,
      properties: {
        description: toSimplifiedZh(place.desc),
        name_sa: place.name_sa ?? undefined,
      },
      source_tier: "authoritative",
      source: SOURCE_PLACE,
    });
    placeIndex.set(name, id);
  }

  for (const [personRaw, schoolRaw] of FOJIN_AFFILIATIONS) {
    const schoolName = toSimplifiedZh(schoolRaw);
    const schoolId = schoolIndex.get(schoolName);
    if (!schoolId) continue;
    const personId = ensurePerson(personRaw, personIndex, entities);
    pushRelation(relations, relSeen, {
      subject_id: personId,
      predicate: "member_of_school",
      object_id: schoolId,
      confidence: 1,
      source: SOURCE_SCHOOL,
    });
  }

  for (const [teacherRaw, studentRaw] of FOJIN_LINEAGES) {
    const teacherId = ensurePerson(teacherRaw, personIndex, entities);
    const studentId = ensurePerson(studentRaw, personIndex, entities);
    pushRelation(relations, relSeen, {
      subject_id: teacherId,
      predicate: "teacher_of",
      object_id: studentId,
      confidence: 1,
      source: SOURCE_LINEAGE,
    });
  }

  for (const [personRaw, placeRaw] of FOJIN_PERSON_PLACE) {
    const placeName = toSimplifiedZh(placeRaw);
    const placeId = placeIndex.get(placeName);
    if (!placeId) continue;
    const personId = ensurePerson(personRaw, personIndex, entities);
    pushRelation(relations, relSeen, {
      subject_id: personId,
      predicate: "active_in",
      object_id: placeId,
      confidence: 0.9,
      source: SOURCE_PERSON_PLACE,
    });
  }

  for (const [schoolRaw, conceptRaw] of FOJIN_SCHOOL_CONCEPT) {
    const schoolName = toSimplifiedZh(schoolRaw);
    const conceptName = toSimplifiedZh(conceptRaw);
    const schoolId = schoolIndex.get(schoolName);
    const conceptId = conceptIndex.get(conceptName);
    if (!schoolId || !conceptId) continue;
    pushRelation(relations, relSeen, {
      subject_id: schoolId,
      predicate: "associated_with",
      object_id: conceptId,
      confidence: 0.9,
      source: SOURCE_SCHOOL_CONCEPT,
    });
  }

  return { entities, relations };
}
