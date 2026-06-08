/**
 * 阅读进度 API
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userKey = searchParams.get("userKey")?.trim();
  const sutraId = searchParams.get("sutraId")?.trim();
  if (!userKey || !sutraId) {
    return NextResponse.json({ error: "userKey and sutraId required" }, { status: 400 });
  }

  const db = getSqlite();
  const row = db
    .prepare(
      `SELECT paragraph_id as paragraphId, scroll_y as scrollY, updated_at as updatedAt
       FROM reading_progress WHERE user_key = ? AND sutra_id = ?`,
    )
    .get(userKey, sutraId) as
    | { paragraphId: string; scrollY: number; updatedAt: number }
    | undefined;

  return NextResponse.json({ progress: row ?? null });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    userKey?: string;
    sutraId?: string;
    sutraSlug?: string;
    sutraTitle?: string;
    paragraphId?: string;
    scrollY?: number;
  };

  const userKey = body.userKey?.trim();
  const sutraId = body.sutraId?.trim();
  const paragraphId = body.paragraphId?.trim();
  if (!userKey || !sutraId || !paragraphId) {
    return NextResponse.json({ error: "userKey, sutraId, paragraphId required" }, { status: 400 });
  }

  const db = getSqlite();
  const now = Date.now();
  db.prepare(
    `INSERT INTO reading_progress (user_key, sutra_id, paragraph_id, scroll_y, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_key, sutra_id) DO UPDATE SET
       paragraph_id = excluded.paragraph_id,
       scroll_y = excluded.scroll_y,
       updated_at = excluded.updated_at`,
  ).run(userKey, sutraId, paragraphId, body.scrollY ?? 0, now);

  if (body.sutraSlug && body.sutraTitle) {
    const histId = `${userKey}:${sutraId}:${now}`;
    db.prepare(
      `INSERT INTO reading_history (id, user_key, sutra_id, sutra_slug, sutra_title, paragraph_id, visited_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    ).run(histId, userKey, sutraId, body.sutraSlug, body.sutraTitle, paragraphId, now);
  }

  return NextResponse.json({ ok: true });
}
