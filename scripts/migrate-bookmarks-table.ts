/**
 * 创建 bookmarks 表的迁移脚本
 * @author 代长亚
 */
import { sql } from "drizzle-orm";
import { getDb, getSqlite, closeDb } from "@/lib/db/sqlite";

export function migrateBookmarksTable() {
  const db = getDb();
  const sqlite = getSqlite();

  // 检查表是否已存在
  const existing = sqlite.prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='bookmarks'"
  ).get() as { name?: string } | undefined;

  if (existing?.name) {
    console.log("[migrate] bookmarks table already exists");
    return;
  }

  db.run(sql`
    CREATE TABLE bookmarks (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      sutra_id TEXT NOT NULL,
      paragraph_index INTEGER NOT NULL,
      content TEXT,
      created_at INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT 0
    )
  `);

  db.run(sql`
    CREATE INDEX bookmark_sutra_user_idx ON bookmarks (sutra_id, user_id)
  `);

  console.log("[migrate] bookmarks table created");
}

// 独立运行支持
if (require.main === module) {
  migrateBookmarksTable();
  closeDb();
}
