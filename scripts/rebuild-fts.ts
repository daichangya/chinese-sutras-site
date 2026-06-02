/**
 * 重建 FTS5 索引
 * @author jingxin
 */
import { getSqlite, closeDb } from "@/lib/db";

const db = getSqlite();
db.exec(`DELETE FROM paragraph_fts;`);
db.exec(`
INSERT INTO paragraph_fts(paragraph_id, sutra_title, text)
SELECT
  p.id,
  s.title,
  trim(
    '正文: ' || p.text ||
    CASE WHEN p.colloquial IS NOT NULL AND length(trim(p.colloquial)) > 0 THEN '\n白话: ' || p.colloquial ELSE '' END ||
    CASE WHEN p.commentary IS NOT NULL AND length(trim(p.commentary)) > 0 THEN '\n注释: ' || p.commentary ELSE '' END ||
    CASE WHEN p.lecture IS NOT NULL AND length(trim(p.lecture)) > 0 THEN '\n讲记: ' || p.lecture ELSE '' END
  ) AS text
FROM paragraph p JOIN sutra s ON s.id = p.sutra_id;
`);
const count = db.prepare(`SELECT count(*) as c FROM paragraph_fts`).get() as { c: number };
console.log(`FTS indexed ${count.c} paragraphs`);
closeDb();
