/**
 * 从语料 MD 回填 paragraph.text（瘦身后恢复阅读热路径）
 * @author 代长亚
 */
import { buildImportBundle } from "@/lib/corpus-v3/import-align";
import { findSutraMetaFiles } from "@/lib/corpus-v3/meta";
import { resolveCorpusRoot } from "@/lib/corpus-v3/root-path";
import { getSqlite, closeDb } from "@/lib/db/sqlite";

const corpusRoot = resolveCorpusRoot();
const xmlRoot = process.env.CBETA_XML_DIR ?? "vendor/xml-p5";
const metaFiles = findSutraMetaFiles(corpusRoot);
const db = getSqlite();

const updateText = db.prepare(`UPDATE paragraph SET text = ? WHERE id = ?`);
const updateColloquial = db.prepare(
  `UPDATE paragraph SET colloquial = ? WHERE id = ? AND (colloquial IS NULL OR trim(colloquial) = '')`,
);

let updated = 0;
let skipped = 0;

const updateBatch = db.transaction(
  (rows: Array<{ id: string; text: string; colloquial: string | null }>) => {
    for (const row of rows) {
      const result = updateText.run(row.text, row.id);
      if (result.changes > 0) updated += 1;
      else skipped += 1;
      if (row.colloquial?.trim()) {
        updateColloquial.run(row.colloquial, row.id);
      }
    }
  },
);

const BATCH = 500;
let batch: Array<{ id: string; text: string; colloquial: string | null }> = [];

for (let i = 0; i < metaFiles.length; i++) {
  const metaPath = metaFiles[i]!;
  try {
    const bundle = buildImportBundle({
      corpusRoot,
      xmlRoot,
      metaPath,
      stripPreface: true,
      mdOnly: true,
    });
    for (const p of bundle.paragraphs) {
      batch.push({
        id: p.canonicalId,
        text: p.text,
        colloquial: p.colloquial,
      });
      if (batch.length >= BATCH) {
        updateBatch(batch);
        batch = [];
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error(`SKIP ${metaPath}: ${msg}`);
  }
  if ((i + 1) % 100 === 0) {
    console.log(`progress ${i + 1}/${metaFiles.length} updated=${updated}`);
  }
}
if (batch.length > 0) updateBatch(batch);

const withText = (
  db.prepare(`SELECT COUNT(*) as c FROM paragraph WHERE trim(text) != ''`).get() as { c: number }
).c;
console.log(`backfill done: updated=${updated} skipped=${skipped} with_text=${withText}`);
closeDb();
