/**
 * 繁体文本预处理（对齐 cbeta reader t2s_post）
 * @author jingxin
 */

/** 去除 CBETA 行间注释如 [1]、[a]、[*] */
export function stripCbetaInlineMarkers(text: string): string {
  return text.replace(/\[\w*?\]|\[\*\]/g, "");
}

/**
 * 繁简转换前预处理
 * v1：去 CBETA 标记；异体规范留给 OpenCC tw locale + 扩展词库
 */
export function normalizeForConversion(text: string): string {
  return stripCbetaInlineMarkers(text);
}
