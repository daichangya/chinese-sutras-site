/**
 * 经目目录/meta 用简体标签（原文/ 仍保留 XML 繁体）
 * @author jingxin
 */
import { t2s } from "@/lib/han";

/** 目录名与 meta 标题/译者等字段统一转简体（不依赖 opencc CLI） */
export function toSimplifiedLabel(text: string | undefined): string | undefined {
  if (!text?.trim()) return text;
  return t2s(text.trim(), { backend: "js" }).text;
}
