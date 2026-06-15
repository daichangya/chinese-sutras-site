/**
 * 导入时段落角色推断（兼容无 block_role 的旧 index）
 * @author 代长亚
 */
import type { BlockRole } from "@/lib/cbeta/block-role";
import { BODY_START_ANCHORS, PREFACE_MARKERS } from "@/lib/cbeta/preface-filter-anchors";

export function inferBlockRoleFromText(text: string, cbetaId: string): BlockRole {
  if (PREFACE_MARKERS.some((m) => text.includes(m))) return "preface";
  const anchor = BODY_START_ANCHORS[cbetaId];
  if (anchor && text.includes(anchor)) return "body";
  return "body";
}

export function inferBlockRolesForParagraphs(
  paragraphs: Array<{ text: string; blockRole?: BlockRole | null }>,
  cbetaId: string,
): BlockRole[] {
  const withExplicit = paragraphs.map((p) => {
    if (p.blockRole === "preface" || p.blockRole === "colophon" || p.blockRole === "byline") {
      return p.blockRole;
    }
    return null;
  });
  if (withExplicit.some((r) => r === "preface")) {
    return paragraphs.map((p, i) => withExplicit[i] ?? (p.blockRole === "verse" ? "verse" : "body"));
  }

  const anchor = BODY_START_ANCHORS[cbetaId];
  if (anchor) {
    const bodyIdx = paragraphs.findIndex((p) => p.text.includes(anchor));
    if (bodyIdx > 0) {
      return paragraphs.map((p, i) =>
        i < bodyIdx ? "preface" : p.blockRole === "verse" ? "verse" : "body",
      );
    }
  }
  return paragraphs.map((p) => p.blockRole ?? inferBlockRoleFromText(p.text, cbetaId));
}
