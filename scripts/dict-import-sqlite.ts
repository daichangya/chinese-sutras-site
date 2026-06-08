/**
 * 辞典 JSONL → SQLite
 * @author 代长亚
 */
import { getSqlite, closeDb } from "@/lib/db/sqlite";
import { resolveDictRoot } from "@/lib/corpus-v3/paths";
import { loadDictCatalog, readEntriesJsonl } from "@/lib/dictionaries/io";
import { prepareFoguangEntryForStorage } from "@/lib/dictionaries/mdict-html";
import { normalizeDictionaryEntryForStorage, toSimplifiedZh } from "@/lib/han/storage-normalize";
import {
  CORPUS_DICT_SOURCE_CODES,
  HAN_DICTIONARY_SOURCES,
} from "@/lib/dictionaries/sources";

const ZH_SOURCES = new Set<string>(CORPUS_DICT_SOURCE_CODES);

function main() {
  const root = resolveDictRoot();
  const catalog = loadDictCatalog(root);
  const allSources = catalog.sources.length ? catalog.sources : HAN_DICTIONARY_SOURCES;
  const sources = allSources.filter((s) => ZH_SOURCES.has(s.code));
  const db = getSqlite();

  const allowed = CORPUS_DICT_SOURCE_CODES.map((c) => `'${c}'`).join(", ");
  db.exec(`DELETE FROM dict_entry WHERE source NOT IN (${allowed})`);
  db.exec(`DELETE FROM dict_source WHERE code NOT IN (${allowed})`);

  const insertSource = db.prepare(
    `INSERT INTO dict_source (code, name_zh, name_en, license, lang, entry_count)
     VALUES (@code, @name_zh, @name_en, @license, @lang, @entry_count)
     ON CONFLICT(code) DO UPDATE SET
       name_zh=excluded.name_zh, name_en=excluded.name_en, license=excluded.license,
       lang=excluded.lang, entry_count=excluded.entry_count`,
  );

  const insertEntry = db.prepare(
    `INSERT OR REPLACE INTO dict_entry (id, source, headword, reading, definition, lang, license, entry_data)
     VALUES (@id, @source, @headword, @reading, @definition, @lang, @license, @entry_data)`,
  );

  db.exec(`DELETE FROM dict_entry_fts`);
  const insertFts = db.prepare(`INSERT INTO dict_entry_fts (rowid, headword, definition) VALUES (?, ?, ?)`);

  const tx = db.transaction(() => {
    for (const src of sources) {
      const entries = readEntriesJsonl(src.code, root);
      if (!entries.length) continue;
      insertSource.run({
        code: src.code,
        name_zh: toSimplifiedZh(src.name_zh),
        name_en: src.name_en ?? null,
        license: src.license ?? null,
        lang: src.lang,
        entry_count: entries.length,
      });
      for (const raw of entries) {
        let e = raw.lang === "zh" ? normalizeDictionaryEntryForStorage(raw) : raw;
        if (e.source === "foguang") {
          e = prepareFoguangEntryForStorage(e);
        }
        insertEntry.run({
          id: e.id,
          source: e.source,
          headword: e.headword,
          reading: e.reading ?? null,
          definition: e.definition,
          lang: e.lang,
          license: e.license ?? null,
          entry_data: e.entry_data ? JSON.stringify(e.entry_data) : null,
        });
        const row = db.prepare(`SELECT rowid FROM dict_entry WHERE id = ?`).get(e.id) as { rowid: number };
        insertFts.run(row.rowid, e.headword, e.definition);
      }
      console.log(`${src.code}: ${entries.length} → SQLite`);
    }
  });

  tx();
  closeDb();
}

main();
