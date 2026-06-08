/**
 * 将 paragraph.text 从繁体转为简体中文
 * @author 代长亚
 */
import { t2sBatch } from "@/lib/han";
import { getSqlite, closeDb } from "@/lib/db/sqlite";

const db = getSqlite();

// 分批处理，避免 OOM
const BATCH_SIZE = 5000;

const countRow = db.prepare(`SELECT COUNT(*) as c FROM paragraph`).get() as { c: number };
const total = countRow.c;
console.log(`Converting ${total} paragraphs from traditional to simplified...`);

const ids = db.prepare(`SELECT id, text FROM paragraph`).all() as Array<{ id: string; text: string }>;

const updateStmt = db.prepare(`UPDATE paragraph SET text = ? WHERE id = ?`);

const updateTx = db.transaction((batch: Array<{ id: string; text: string }>) => {
  for (const row of batch) {
    const simplified = t2sBatch(row.text);
    updateStmt.run(simplified, row.id);
  }
});

let processed = 0;
for (let i = 0; i < ids.length; i += BATCH_SIZE) {
  const batch = ids.slice(i, i + BATCH_SIZE);
  updateTx(batch);
  processed += batch.length;
  if (processed % 50000 === 0 || processed === total) {
    console.log(`Progress: ${processed}/${total} (${Math.round(processed / total * 100)}%)`);
  }
}

console.log(`Done: ${total} paragraphs converted to simplified Chinese`);
closeDb();
