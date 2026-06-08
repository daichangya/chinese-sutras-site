/**
 * 种子：今日经句
 * @author 代长亚
 */
import { getSqlite, closeDb } from "@/lib/db/sqlite";

const db = getSqlite();
const date = process.env.VERSE_DATE ?? new Date().toISOString().slice(0, 10);

const xinjing = db.prepare(`SELECT p.id, p.text FROM paragraph p JOIN sutra s ON s.id = p.sutra_id WHERE s.slug = 'xinjing' ORDER BY p.seq LIMIT 1`).get() as
  | { id: string; text: string }
  | undefined;

db.prepare(
  `INSERT INTO daily_verse (id, verse_date, paragraph_id, custom_text, ai_summary)
   VALUES (?, ?, ?, ?, NULL)
   ON CONFLICT(verse_date) DO UPDATE SET paragraph_id=excluded.paragraph_id, custom_text=excluded.custom_text`,
).run(
  `daily-${date}`,
  date,
  xinjing?.id ?? null,
  xinjing?.text?.slice(0, 60) ?? "凡所有相，皆是虚妄。若见诸相非相，则见如来。",
);

console.log(`Seeded daily verse for ${date}`);
closeDb();
