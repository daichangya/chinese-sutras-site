/**
 * bulei 分组目录名（统计 / 可选 --layout bulei；默认语料为 flat2 不进路径）
 * @author 代长亚
 */
import { toSimplifiedLabel } from "@/lib/corpus-v3/sutra-labels";

const MAX_DIR_LEN = 120;

/** 去掉 CBETA 缺字实体等不宜作路径的片段 */
export function stripBuleiPathNoise(label: string): string {
  return label
    .replace(/&[A-Za-z0-9]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 将 bulei 分组标题转为磁盘目录名（保留可读性，禁止路径分隔符）
 * @author 代长亚
 */
export function buleiGroupDirName(label: string): string {
  const cleaned = stripBuleiPathNoise(label)
    .replace(/\s*\/\s*/g, "／")
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "未分组";
  const simplified = toSimplifiedLabel(cleaned) ?? cleaned;
  if (simplified.length <= MAX_DIR_LEN) return simplified;
  return `${simplified.slice(0, MAX_DIR_LEN).trim()}…`;
}
