/**
 * 建表 + FTS5 虚拟表
 * @author jingxin
 */
import fs from "fs";
import path from "path";
import { getSqlite, closeDb } from "@/lib/db";

const dataDir = process.env.DATA_DIR ?? "./data";
fs.mkdirSync(dataDir, { recursive: true });

const db = getSqlite();

db.exec(`
CREATE TABLE IF NOT EXISTS sutra (
  id TEXT PRIMARY KEY,
  cbeta_id TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  translator TEXT,
  category TEXT,
  char_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chapter (
  id TEXT PRIMARY KEY,
  sutra_id TEXT NOT NULL REFERENCES sutra(id),
  seq INTEGER NOT NULL,
  title TEXT
);

CREATE TABLE IF NOT EXISTS paragraph (
  id TEXT PRIMARY KEY,
  sutra_id TEXT NOT NULL REFERENCES sutra(id),
  juan_seq INTEGER NOT NULL DEFAULT 0,
  start_ref TEXT,
  end_ref TEXT,
  parser_pid TEXT,
  content_hash TEXT,
  seq INTEGER NOT NULL,
  text TEXT NOT NULL,
  colloquial TEXT,
  commentary TEXT,
  lecture TEXT
);

CREATE INDEX IF NOT EXISTS paragraph_sutra_seq_idx ON paragraph(sutra_id, seq);

CREATE TABLE IF NOT EXISTS tag (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sutra_tag (
  sutra_id TEXT NOT NULL,
  tag_id TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS topic (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS topic_item (
  id TEXT PRIMARY KEY,
  topic_id TEXT NOT NULL,
  sutra_id TEXT NOT NULL,
  sort_order INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS daily_verse (
  id TEXT PRIMARY KEY,
  verse_date TEXT NOT NULL UNIQUE,
  paragraph_id TEXT,
  custom_text TEXT,
  ai_summary TEXT
);

CREATE TABLE IF NOT EXISTS ai_explanation_cache (
  cache_key TEXT PRIMARY KEY,
  tab TEXT NOT NULL,
  content TEXT NOT NULL,
  model TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS user_bookmark (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  target_type TEXT NOT NULL,
  sutra_id TEXT,
  paragraph_id TEXT,
  created_at INTEGER NOT NULL
);
`);

db.exec(`
CREATE VIRTUAL TABLE IF NOT EXISTS paragraph_fts USING fts5(
  paragraph_id UNINDEXED,
  sutra_title,
  text,
  tokenize='unicode61'
);
`);

function ensureColumn(table: string, column: string, ddl: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    db.exec(ddl);
    console.log(`Added ${table}.${column}`);
  }
}

ensureColumn("topic", "intro_md", `ALTER TABLE topic ADD COLUMN intro_md TEXT`);
ensureColumn("topic_item", "quote", `ALTER TABLE topic_item ADD COLUMN quote TEXT`);

// 新增列（如果不存在）
ensureColumn("paragraph", "start_ref", `ALTER TABLE paragraph ADD COLUMN start_ref TEXT`);
ensureColumn("paragraph", "end_ref", `ALTER TABLE paragraph ADD COLUMN end_ref TEXT`);
ensureColumn("paragraph", "parser_pid", `ALTER TABLE paragraph ADD COLUMN parser_pid TEXT`);
ensureColumn("paragraph", "content_hash", `ALTER TABLE paragraph ADD COLUMN content_hash TEXT`);
ensureColumn("paragraph", "commentary", `ALTER TABLE paragraph ADD COLUMN commentary TEXT`);
ensureColumn("paragraph", "lecture", `ALTER TABLE paragraph ADD COLUMN lecture TEXT`);
ensureColumn("paragraph", "juan_seq", `ALTER TABLE paragraph ADD COLUMN juan_seq INTEGER NOT NULL DEFAULT 0`);

db.exec(`
CREATE TABLE IF NOT EXISTS pinyin_cache (
  cache_key TEXT PRIMARY KEY,
  readings TEXT NOT NULL,
  dict_version TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`);

// === Schema V2: DB 存简体，删除冗余列 ===
function dropColumn(table: string, column: string): void {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} DROP COLUMN ${column}`);
    console.log(`Dropped ${table}.${column}`);
  }
}

// 删除冗余列（全 NULL 或不需要存储的字段）
dropColumn("sutra", "title_simplified");
dropColumn("paragraph", "text_simplified");
dropColumn("paragraph", "pinyin_text");

console.log(`Migrated database at ${path.join(dataDir, "jingxin.db")}`);
closeDb();
