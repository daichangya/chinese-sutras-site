/**
 * 用户本地数据同步 API（书签 / 批注）
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";
import { requireDataAccess } from "@/lib/auth/require-user";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    userKey?: string;
    bookmarks?: Array<{
      id: string;
      sutraId: string;
      sutraSlug: string;
      sutraTitle: string;
      paragraphId?: string;
      createdAt?: number;
    }>;
    annotations?: Array<{
      id: string;
      sutraId: string;
      paragraphId: string;
      quote: string;
      note?: string;
      createdAt?: number;
    }>;
  };

  const access = await requireDataAccess(body.userKey);
  if (access instanceof NextResponse) return access;
  const { ctx } = access;
  const userKey = ctx.dataKey;

  const db = getSqlite();
  const now = Date.now();

  if (body.bookmarks?.length) {
    const stmt = db.prepare(
      `INSERT INTO user_bookmark_sync (id, user_key, sutra_id, sutra_slug, sutra_title, paragraph_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         sutra_slug = excluded.sutra_slug,
         sutra_title = excluded.sutra_title,
         paragraph_id = excluded.paragraph_id`,
    );
    for (const b of body.bookmarks) {
      stmt.run(
        b.id,
        userKey,
        b.sutraId,
        b.sutraSlug,
        b.sutraTitle,
        b.paragraphId ?? null,
        b.createdAt ?? now,
      );
    }
  }

  if (body.annotations?.length) {
    const stmt = db.prepare(
      `INSERT INTO user_annotation (id, user_key, sutra_id, paragraph_id, start_offset, end_offset, quote, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         quote = excluded.quote,
         note = excluded.note,
         updated_at = excluded.updated_at`,
    );
    for (const a of body.annotations) {
      stmt.run(
        a.id,
        userKey,
        a.sutraId,
        a.paragraphId,
        a.quote,
        a.note ?? null,
        a.createdAt ?? now,
        now,
      );
    }
  }

  return NextResponse.json({ ok: true, loggedIn: ctx.loggedIn });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const access = await requireDataAccess(searchParams.get("userKey"));
  if (access instanceof NextResponse) return access;
  const { ctx } = access;
  const userKey = ctx.dataKey;

  const db = getSqlite();
  const bookmarks = db
    .prepare(
      `SELECT id, sutra_id as sutraId, sutra_slug as sutraSlug, sutra_title as sutraTitle, paragraph_id as paragraphId, created_at as createdAt
       FROM user_bookmark_sync WHERE user_key = ? ORDER BY created_at DESC LIMIT 100`,
    )
    .all(userKey);
  const annotations = db
    .prepare(
      `SELECT id, sutra_id as sutraId, paragraph_id as paragraphId, quote, note, created_at as createdAt
       FROM user_annotation WHERE user_key = ? ORDER BY updated_at DESC LIMIT 100`,
    )
    .all(userKey);

  return NextResponse.json({ bookmarks, annotations, loggedIn: ctx.loggedIn });
}
