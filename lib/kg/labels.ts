/**
 * 知识图谱中文展示标签（client/server 共享）
 * @author 代长亚
 */

export const TYPE_LABELS: Record<string, string> = {
  person: "人物",
  text: "典籍",
  monastery: "寺院",
  school: "宗派",
  place: "地点",
  concept: "概念",
  dynasty: "朝代",
};

export const TYPE_COLORS: Record<string, string> = {
  person: "#c75450",
  text: "#4a7c9b",
  monastery: "#6b8e5b",
  school: "#7b5ea7",
  place: "#c08b3e",
  concept: "#3d8a8a",
  dynasty: "#b35c8a",
};

export const PREDICATE_LABELS: Record<string, string> = {
  translated: "翻译",
  active_in: "所处",
  alt_translation: "异译",
  parallel_text: "平行文本",
  member_of_school: "属于宗派",
  teacher_of: "师承",
  cites: "引用",
  commentary_on: "注疏",
  associated_with: "相关",
  composed_in: "成于",
  parallel_to: "平行",
};

export const PREDICATE_COLORS: Record<string, string> = {
  translated: "#4a7c9b",
  active_in: "#b35c8a",
  alt_translation: "#3d8a8a",
  parallel_text: "#6b8e5b",
  member_of_school: "#7b5ea7",
  teacher_of: "#c08b3e",
  cites: "#bbb5a6",
  commentary_on: "#c75450",
  associated_with: "#5b8c6b",
  composed_in: "#b35c8a",
  parallel_to: "#6b8e5b",
};

export const PREDICATE_DESC: Record<string, string> = {
  translated: "某人翻译了某部典籍",
  teacher_of: "师徒之间的传法承继关系",
  member_of_school: "人物所归属的宗派",
  cites: "一部典籍引用了另一部典籍",
  commentary_on: "对某部典籍的注释或疏解",
  active_in: "人物活跃的朝代或地域",
  alt_translation: "同一原典的不同译本",
  parallel_text: "跨语言或跨藏经对应的平行文本",
  associated_with: "其它相关联系",
  composed_in: "典籍成书或译出的时代",
  parallel_to: "标题或内容相近的平行文本",
};

export const PREDICATE_ORDER = [
  "teacher_of",
  "translated",
  "commentary_on",
  "composed_in",
  "active_in",
  "member_of_school",
  "associated_with",
  "cites",
  "alt_translation",
  "parallel_text",
  "parallel_to",
] as const;

export const PROPERTY_LABELS: Record<string, string> = {
  role: "角色",
  dynasty: "朝代",
  period: "时期",
  birth: "出生",
  death: "去世",
  birth_year: "生年",
  death_year: "卒年",
  birthplace: "出生地",
  school: "宗派",
  tradition: "传承",
  title: "称号",
  aka: "别名",
  dates: "年代",
  region: "地区",
  location: "位置",
  founded: "创建",
  founder: "创始人",
  language: "语言",
  author: "作者",
  translator: "译者",
  year_start: "生年",
  year_end: "卒年",
  description: "简介",
  raw_translator: "原始译者",
};

export const SOURCE_TIER_LABELS: Record<string, string> = {
  authoritative: "DILA 规范",
  derived: "语料推导",
  heuristic: "待核实",
};

export const SOURCE_LABELS: Record<string, string> = {
  dila_catalog: "DILA 规范目录",
  dila: "DILA 规范库",
  corpus_meta: "CBETA 元数据",
  "auto:cbeta_metadata": "CBETA 元数据",
};

export function labelPredicate(predicate: string): string {
  return PREDICATE_LABELS[predicate] ?? predicate;
}

export function labelProperty(key: string): string {
  return PROPERTY_LABELS[key] ?? key;
}

export function labelType(entityType: string): string {
  return TYPE_LABELS[entityType] ?? entityType;
}
