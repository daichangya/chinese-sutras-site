/**
 * 主库瘦身：paragraph 仅保留身份列，FTS 迁至 jingxin-search.db
 * @author 代长亚
 */
import fs from "fs";
import path from "path";
import { getSqlite, closeDb } from "@/lib/db/sqlite";
import { closeSearchDb, ensureSearchSchema, getSearchSqlite } from "@/lib/db/search-sqlite";
import { paragraphHasTextColumn } from "@/lib/db/paragraph-schema";

const dataDir = process.env.DATA_DIR ?? "./data";
const backup = process.argv.includes("--no-backup") === false;

const db = getSqlite();

function hasTable(name: string): boolean {
  return !!db.prepare(`SELECT 1 FROM sqlite_master WHERE type='table' AND name=?`).get(name);
}

if (!paragraphHasTextColumn(db)) {
  console.log("paragraph.text 已移除，跳过瘦身迁移");
} else {
  if (backup) {
    const src = path.join(dataDir, "jingxin.db");
    const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const dest = path.join(dataDir, `jingxin.db.bak-${stamp}`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Backup: ${dest}`);
    }
  }

  db.exec(`
CREATE TABLE paragraph_slim (
  id TEXT PRIMARY KEY,
  sutra_id TEXT NOT NULL REFERENCES sutra(id),
  juan_seq INTEGER NOT NULL DEFAULT 0,
  seq INTEGER NOT NULL,
  colloquial TEXT,
  commentary TEXT,
  lecture TEXT
);
`);

  db.exec(`
INSERT INTO paragraph_slim (id, sutra_id, juan_seq, seq, colloquial, commentary, lecture)
SELECT id, sutra_id, juan_seq, seq, colloquial, commentary, lecture FROM paragraph;
`);

  db.exec(`DROP TABLE paragraph;`);
  db.exec(`ALTER TABLE paragraph_slim RENAME TO paragraph;`);
  db.exec(`CREATE INDEX IF NOT EXISTS paragraph_sutra_seq_idx ON paragraph(sutra_id, seq);`);
  db.exec(`CREATE INDEX IF NOT EXISTS paragraph_sutra_juan_idx ON paragraph(sutra_id, juan_seq);`);

  if (hasTable("paragraph_fts")) {
    db.exec(`DROP TABLE paragraph_fts;`);
    console.log("Dropped paragraph_fts from main DB (use jingxin-search.db)");
  }

  console.log("Slim paragraph migration done. Running VACUUM…");
  db.exec("VACUUM");
  console.log("VACUUM complete.");
}

const searchDb = getSearchSqlite();
ensureSearchSchema(searchDb);
console.log(`Search DB ready at ${path.join(dataDir, "jingxin-search.db")}`);

closeSearchDb();
closeDb();
