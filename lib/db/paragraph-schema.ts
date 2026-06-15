/**
 * paragraph 表结构探测（瘦身迁移前后兼容）
 * @author 代长亚
 */
import type Database from "better-sqlite3";
import { isLowMemoryDeploy } from "@/lib/deploy/profile";

let cachedHasText: boolean | null = null;

/** 测试用：重置列探测缓存 */
export function resetParagraphSchemaCache(): void {
  cachedHasText = null;
}

export function paragraphHasTextColumn(db: Database.Database): boolean {
  if (cachedHasText !== null) return cachedHasText;
  const cols = db.prepare(`PRAGMA table_info(paragraph)`).all() as Array<{ name: string }>;
  cachedHasText = cols.some((c) => c.name === "text");
  return cachedHasText;
}

export function requireParagraphTextColumn(db: Database.Database): void {
  if (isLowMemoryDeploy()) return;
  if (!paragraphHasTextColumn(db)) {
    throw new Error(
      "paragraph.text 列不存在。请运行 npm run db:migrate && npm run db:backfill-text 回填正文后再启动。",
    );
  }
}

export function paragraphIdentitySelectSql(): string {
  return `id, sutra_id as sutraId, juan_seq as chapterSeq, seq, colloquial, block_role as blockRole`;
}

export function paragraphSelectSql(): string {
  return `${paragraphIdentitySelectSql()}, text`;
}
