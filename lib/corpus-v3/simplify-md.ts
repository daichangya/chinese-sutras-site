/**
 * corpus:simplify 涉及的 MD 路径收集
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { SIMPLIFY_MD_DIRS } from "./corpus-dirs";

/** 仅白话/注释 MD（不含 原文/、简体/、_index） */
export function collectSimplifyMdFiles(sutraRoot: string): string[] {
  const out: string[] = [];
  for (const sub of SIMPLIFY_MD_DIRS) {
    const dir = path.join(sutraRoot, sub);
    if (!fs.existsSync(dir)) continue;
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      if (ent.isFile() && ent.name.endsWith(".md")) {
        out.push(path.join(dir, ent.name));
      }
    }
  }
  return out;
}
