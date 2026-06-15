/**
 * 段落块角色（序/正文/偈等）推导
 * @author 代长亚
 */
import type { BlockKind } from "@/lib/cbeta/structure";

export type BlockRole = "preface" | "body" | "verse" | "byline" | "colophon" | "other";

const PREFACE_SECTION_RE = /序|跋|御製|御制/;

export function deriveBlockRole(opts: {
  divType?: string;
  section?: string;
  kind: BlockKind;
}): BlockRole {
  if (opts.kind === "verse") return "verse";
  const div = opts.divType?.toLowerCase();
  if (div === "xu") return "preface";
  if (div === "jing") return "body";
  if (opts.section && PREFACE_SECTION_RE.test(opts.section)) return "preface";
  if (opts.kind === "prose") return "body";
  return "other";
}

export function isAuxiliaryBlockRole(role: BlockRole | null | undefined): boolean {
  return role === "preface" || role === "colophon" || role === "byline";
}

export function isReaderBodyRole(role: BlockRole | null | undefined): boolean {
  return !role || role === "body" || role === "verse";
}
