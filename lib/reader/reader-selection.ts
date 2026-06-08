/**
 * 阅读器正文划选工具
 * @author 代长亚
 */

export const READER_CONTENT_ID = "reader-content";

/** 选区是否落在阅读器正文内 */
export function isNodeInReaderContent(node: Node | null): boolean {
  if (!node) return false;
  const article = document.getElementById(READER_CONTENT_ID);
  if (!article) return false;
  const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element);
  return el ? article.contains(el) : false;
}

/** 从当前选区读取正文划选结果 */
export function getReaderTextSelection(): {
  text: string;
  paragraphId?: string;
} | null {
  if (typeof window === "undefined") return null;

  const sel = window.getSelection();
  if (!sel || sel.isCollapsed) return null;

  const anchor = sel.anchorNode;
  const focus = sel.focusNode;
  if (!isNodeInReaderContent(anchor) && !isNodeInReaderContent(focus)) {
    return null;
  }

  const text = sel.toString().trim();
  if (text.length < 1) return null;

  const anchorEl =
    anchor?.nodeType === Node.TEXT_NODE
      ? anchor.parentElement
      : (anchor as Element | null);
  const paragraphId =
    anchorEl?.closest("[data-paragraph-id]")?.getAttribute("data-paragraph-id") ??
    undefined;

  return { text, paragraphId };
}
