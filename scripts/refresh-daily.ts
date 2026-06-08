/**
 * 刷新今日经句与 AI 解读（运维脚本）
 * @author 代长亚
 */
import { execSync } from "child_process";
import { chatCompletion } from "@/lib/ai/gateway";
import { buildDailySummaryPrompt } from "@/lib/ai/prompts";
import { getSqlite, closeDb } from "@/lib/db/sqlite";

execSync("npm run seed:daily", { stdio: "inherit", cwd: process.cwd() });

const db = getSqlite();
const date = process.env.VERSE_DATE ?? new Date().toISOString().slice(0, 10);
const row = db
  .prepare(`SELECT custom_text as customText FROM daily_verse WHERE verse_date = ?`)
  .get(date) as { customText: string | null } | undefined;

const verseText = row?.customText ?? "凡所有相，皆是虚妄。";
const sutraTitle = "般若波羅蜜多心經";

async function main() {
  const { system, user } = buildDailySummaryPrompt(verseText, sutraTitle);
  const summary = await chatCompletion([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);

  db.prepare(
    `UPDATE daily_verse SET ai_summary = ? WHERE verse_date = ?`,
  ).run(summary, date);

  console.log(`Daily verse ${date} refreshed. Summary: ${summary.slice(0, 80)}…`);
  closeDb();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
