/**
 * 抄经字帖文本处理
 * @author jingxin
 */

export const COPYBOOK_CHAR_LIMIT = 2000;

/** 保留汉字，去掉空白与标点 */
export function extractHanChars(text: string): string {
  return [...text].filter((c) => /\p{Script=Han}/u.test(c)).join("");
}

/** 截断至字数上限 */
export function truncateHan(
  text: string,
  limit = COPYBOOK_CHAR_LIMIT,
): { text: string; truncated: boolean; originalCount: number } {
  const chars = [...text];
  const originalCount = chars.length;
  if (chars.length <= limit) {
    return { text, truncated: false, originalCount };
  }
  return { text: chars.slice(0, limit).join(""), truncated: true, originalCount };
}

/** 合并选中段落为抄经正文 */
export function mergeParagraphTexts(
  paragraphs: { id: string; text: string }[],
  selectedIds: Set<string>,
): string {
  return paragraphs.filter((p) => selectedIds.has(p.id)).map((p) => p.text).join("");
}

/** 按需转换繁体（切片调用 API） */
export async function s2tText(text: string): Promise<string> {
  const chunkSize = 2000;
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    const slice = text.slice(i, i + chunkSize);
    const res = await fetch("/api/convert/s2t", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: slice }),
    });
    if (!res.ok) return text;
    const data = (await res.json()) as { text?: string };
    chunks.push(data.text ?? slice);
  }
  return chunks.join("");
}
