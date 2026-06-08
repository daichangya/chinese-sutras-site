/**
 * 辞典源目录名（中文文件夹，与 code 解耦）
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { resolveDictRoot } from "@/lib/corpus-v3/paths";
import { getHanDictionarySource } from "./sources";

/** 旧版英文/罗马字目录名 → code */
export const LEGACY_DICT_SOURCE_DIRS: Record<string, string> = {
  soothill: "soothill",
  dingfubao: "dingfubao",
  nanshanlu: "nanshanlu",
  mahavyutpatti: "mahavyutpatti",
  pentaglot: "pentaglot",
  buddhadatta: "buddhadatta",
  nti: "nti",
};

export function dictSourceDirName(code: string): string {
  const meta = getHanDictionarySource(code);
  if (meta?.dir_name) return meta.dir_name;
  if (meta?.name_zh) return meta.name_zh.replace(/[（(].*$/, "").trim();
  return code;
}

/** 解析 sources 下实际目录（优先中文名，兼容旧目录） */
export function resolveDictSourceDir(code: string, root = resolveDictRoot()): string {
  const zh = path.join(root, "sources", dictSourceDirName(code));
  const legacy = path.join(root, "sources", code);
  if (fs.existsSync(zh)) return zh;
  if (fs.existsSync(legacy)) return legacy;
  return zh;
}
