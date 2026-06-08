/**
 * 辞典中文 headword 过滤
 * @author 代长亚
 */

const CJK_RE = /[\u3400-\u9FFF\uF900-\uFAFF]/;

/** headword 含至少一个汉字（含扩展区） */
export function isChineseHeadword(headword: string): boolean {
  const t = headword.trim();
  if (!t) return false;
  return CJK_RE.test(t);
}
