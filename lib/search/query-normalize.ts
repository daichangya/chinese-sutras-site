/**
 * 搜索查询规范化（简繁、去标点）
 * @author 代长亚
 */
import { detectScript, t2s } from "@/lib/han";

/** CBETA / cbeta-api 风格：去掉检索无关标点 */
const SEARCH_PUNC_RE = /[\s\u3000.,，。、；;：:！!？?「」『』【】（）()\[\]{}《》〈〉"'·…—\-_/\\|@#$%^&*+=~`]/g;

export function removeSearchPunctuation(text: string): string {
  return text.replace(SEARCH_PUNC_RE, "");
}

/** 经目标题检索用：去括号卷帙后缀（对标 cbwork-bin/cbeta_epub2） */
export function normalizeSutraTitleForSearch(title: string): string {
  return title
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

export function normalizeSearchQuery(q: string): string {
  let trimmed = q.trim();
  if (!trimmed) return "";
  if (detectScript(trimmed) === "traditional") {
    trimmed = t2s(trimmed, { backend: "js" }).text;
  }
  return removeSearchPunctuation(trimmed);
}

/** 提取 query 中的 CJK 汉字（用于字符交集经目检索） */
export function extractCjkChars(text: string): string[] {
  const chars: string[] = [];
  for (const ch of text) {
    if (/\p{Script=Han}/u.test(ch)) chars.push(ch);
  }
  return chars;
}
