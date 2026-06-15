/**
 * 阅读器右键菜单文本与段落解析
 * @author 代长亚
 */

export function resolveContextText(
  selectionText: string,
  paragraphText?: string,
): string {
  const trimmed = selectionText.trim();
  if (trimmed.length > 0) return trimmed;
  if (paragraphText) return paragraphText.slice(0, 80);
  return "";
}

export function resolveContextParagraphId(
  selectionParagraphId: string | undefined,
  activeParagraphId: string | undefined,
): string | undefined {
  return selectionParagraphId ?? activeParagraphId;
}
