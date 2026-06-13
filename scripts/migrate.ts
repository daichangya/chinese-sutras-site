/**
 * 建表 + FTS5 虚拟表
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { getSqlite, closeDb } from "@/lib/db/sqlite";
import { closeSearchDb, ensureSearchSchema, getSearchSqlite } from "@/lib/db/search-sqlite";
import { closeAuthDb, getAuthSqlite, resolveAuthDbPath } from "@/lib/auth/sqlite";
import {
  dropLegacyAuthTablesFromMain,
  ensureAuthSchema,
  migrateAuthFromMainDbIfNeeded,
} from "@/lib/auth/ensure-schema";

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
  seq INTEGER NOT NULL,
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
ensureColumn("paragraph", "text", `ALTER TABLE paragraph ADD COLUMN text TEXT NOT NULL DEFAULT ''`);
ensureColumn("daily_verse", "snippet_text", `ALTER TABLE daily_verse ADD COLUMN snippet_text TEXT`);
ensureColumn("daily_verse", "source_title", `ALTER TABLE daily_verse ADD COLUMN source_title TEXT`);

db.exec(`
CREATE TABLE IF NOT EXISTS pinyin_cache (
  cache_key TEXT PRIMARY KEY,
  readings TEXT NOT NULL,
  dict_version TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS dict_source (
  code TEXT PRIMARY KEY,
  name_zh TEXT NOT NULL,
  name_en TEXT,
  license TEXT,
  lang TEXT NOT NULL,
  entry_count INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS dict_entry (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  headword TEXT NOT NULL,
  reading TEXT,
  definition TEXT NOT NULL,
  lang TEXT NOT NULL,
  license TEXT,
  entry_data TEXT
);

CREATE INDEX IF NOT EXISTS dict_entry_headword_idx ON dict_entry(headword);
CREATE INDEX IF NOT EXISTS dict_entry_source_idx ON dict_entry(source);

CREATE VIRTUAL TABLE IF NOT EXISTS dict_entry_fts USING fts5(
  headword,
  definition,
  tokenize='unicode61'
);

CREATE TABLE IF NOT EXISTS kg_entity (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  name_en TEXT,
  external_ids TEXT,
  properties TEXT,
  source_tier TEXT NOT NULL,
  source TEXT NOT NULL,
  text_id TEXT
);

CREATE INDEX IF NOT EXISTS kg_entity_type_name_idx ON kg_entity(entity_type, name_zh);

CREATE TABLE IF NOT EXISTS kg_relation (
  subject_id TEXT NOT NULL,
  predicate TEXT NOT NULL,
  object_id TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 1,
  source TEXT NOT NULL,
  PRIMARY KEY (subject_id, predicate, object_id)
);

CREATE TABLE IF NOT EXISTS kg_entity_text (
  entity_id TEXT NOT NULL,
  cbeta_id TEXT NOT NULL,
  PRIMARY KEY (entity_id, cbeta_id)
);

CREATE TABLE IF NOT EXISTS bookmarks (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  sutra_id TEXT NOT NULL,
  paragraph_index INTEGER NOT NULL,
  content TEXT,
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS bookmark_sutra_user_idx ON bookmarks(sutra_id, user_id);

CREATE TABLE IF NOT EXISTS share (
  id TEXT PRIMARY KEY,
  sutra_id TEXT NOT NULL,
  paragraph_id TEXT NOT NULL,
  share_code TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS reading_progress (
  user_key TEXT NOT NULL,
  sutra_id TEXT NOT NULL,
  paragraph_id TEXT NOT NULL,
  scroll_y REAL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_key, sutra_id)
);

CREATE TABLE IF NOT EXISTS reading_history (
  id TEXT PRIMARY KEY,
  user_key TEXT NOT NULL,
  sutra_id TEXT NOT NULL,
  sutra_slug TEXT NOT NULL,
  sutra_title TEXT NOT NULL,
  paragraph_id TEXT,
  visited_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS reading_history_user_idx ON reading_history(user_key, visited_at DESC);

CREATE TABLE IF NOT EXISTS user_annotation (
  id TEXT PRIMARY KEY,
  user_key TEXT NOT NULL,
  sutra_id TEXT NOT NULL,
  paragraph_id TEXT NOT NULL,
  start_offset INTEGER NOT NULL DEFAULT 0,
  end_offset INTEGER NOT NULL DEFAULT 0,
  quote TEXT NOT NULL,
  note TEXT,
  color TEXT DEFAULT 'amber',
  created_at INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS user_annotation_user_sutra_idx ON user_annotation(user_key, sutra_id);

CREATE TABLE IF NOT EXISTS user_bookmark_sync (
  id TEXT PRIMARY KEY,
  user_key TEXT NOT NULL,
  sutra_id TEXT NOT NULL,
  sutra_slug TEXT NOT NULL,
  sutra_title TEXT NOT NULL,
  paragraph_id TEXT,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS user_bookmark_sync_user_idx ON user_bookmark_sync(user_key);

CREATE TABLE IF NOT EXISTS corpus_stats (
  id TEXT PRIMARY KEY,
  sutra_count INTEGER NOT NULL DEFAULT 0,
  paragraph_count INTEGER NOT NULL DEFAULT 0,
  dict_entry_count INTEGER NOT NULL DEFAULT 0,
  kg_entity_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS sutra_colloquial (
  sutra_id TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS kg_geo_flat (
  entity_id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  name_zh TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  geo_source TEXT,
  slug TEXT,
  province TEXT,
  city TEXT,
  description TEXT
);
CREATE INDEX IF NOT EXISTS idx_kg_geo_flat_type ON kg_geo_flat(entity_type);
CREATE INDEX IF NOT EXISTS idx_kg_geo_flat_bbox ON kg_geo_flat(lat, lng);
`);

db.exec(`
CREATE VIRTUAL TABLE IF NOT EXISTS sutra_fts USING fts5(
  sutra_id UNINDEXED,
  title,
  translator,
  category,
  cbeta_id,
  tokenize='unicode61'
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

const searchDb = getSearchSqlite();
ensureSearchSchema(searchDb);

const authDb = getAuthSqlite();
ensureAuthSchema(authDb);
const authMigration = migrateAuthFromMainDbIfNeeded(authDb, db);
if (authMigration.migrated) {
  console.log(`Migrated ${authMigration.users} user(s) from main DB to auth DB`);
} else {
  dropLegacyAuthTablesFromMain(db);
}

console.log(`Migrated main DB at ${path.join(dataDir, "jingxin.db")}`);
console.log(`Auth DB at ${resolveAuthDbPath(dataDir)} (app_user / oauth / session)`);
console.log(`Search DB at ${path.join(dataDir, "jingxin-search.db")} (paragraph_fts)`);
console.log(`Run npm run db:refresh-perf-cache after import to populate perf tables`);
console.log(`Run npm run fts:rebuild after corpus import`);
closeAuthDb();
closeSearchDb();
closeDb();
