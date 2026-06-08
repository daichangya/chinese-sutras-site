/**
 * 辞典插图 API 路径校验
 * @author 代长亚
 */
import path from "path";
import { resolveDictRoot } from "@/lib/corpus-v3/paths";

export const DICT_ASSET_SOURCES = ["foguang"] as const;
export type DictAssetSource = (typeof DICT_ASSET_SOURCES)[number];

const FOGUANG_DIR = "佛光大辞典";
const ASSET_FILENAME_RE = /^[\w.-]+\.(jpg|jpeg|png)$/i;

/** 校验 source + path 段是否允许访问 */
export function isAllowedDictAssetPath(source: string, pathSegments: string[]): boolean {
  if (source !== "foguang") return false;
  if (pathSegments.length !== 2) return false;
  if (pathSegments[0] !== "FGDCDZDB") return false;
  const file = pathSegments[1]!;
  if (file.includes("..") || file.includes("/") || file.includes("\\")) return false;
  return ASSET_FILENAME_RE.test(file);
}

/** 解析 foguang 插图绝对路径；不在语料根下则返回 null */
export function resolveDictAssetAbsolutePath(
  source: string,
  pathSegments: string[],
): string | null {
  if (!isAllowedDictAssetPath(source, pathSegments)) return null;
  const dictRoot = resolveDictRoot();
  const rel = path.join("sources", FOGUANG_DIR, "assets", ...pathSegments);
  const abs = path.resolve(dictRoot, rel);
  const base = path.resolve(dictRoot, "sources", FOGUANG_DIR, "assets");
  if (!abs.startsWith(base + path.sep) && abs !== base) return null;
  return abs;
}
