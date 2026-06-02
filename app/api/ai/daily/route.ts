import { NextResponse } from "next/server";
import { chatCompletion } from "@/lib/ai/gateway";
import { buildDailySummaryPrompt } from "@/lib/ai/prompts";
import { getSqlite } from "@/lib/db";

export async function POST(req: Request) {
  const body = (await req.json()) as { verseText?: string; sutraTitle?: string; verseDate?: string };
  const verseText = body.verseText?.trim();
  const sutraTitle = body.sutraTitle ?? "";
  const verseDate = body.verseDate ?? new Date().toISOString().slice(0, 10);

  if (!verseText) {
    return NextResponse.json({ error: "verseText required" }, { status: 400 });
  }

  const db = getSqlite();
  const existing = db
    .prepare(`SELECT ai_summary FROM daily_verse WHERE verse_date = ?`)
    .get(verseDate) as { ai_summary: string | null } | undefined;

  if (existing?.ai_summary) {
    return NextResponse.json({ summary: existing.ai_summary, cached: true });
  }

  const { system, user } = buildDailySummaryPrompt(verseText, sutraTitle);
  const summary = await chatCompletion([
    { role: "system", content: system },
    { role: "user", content: user },
  ]);

  db.prepare(
    `INSERT INTO daily_verse (id, verse_date, custom_text, ai_summary) VALUES (?, ?, ?, ?)
     ON CONFLICT(verse_date) DO UPDATE SET ai_summary=excluded.ai_summary`,
  ).run(`daily-${verseDate}`, verseDate, verseText, summary);

  return NextResponse.json({ summary, cached: false });
}
