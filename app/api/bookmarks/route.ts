/**
 * 书签 API 端点 — 服务端持久化
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { eq, and, desc, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookmark, sutra } from "@/lib/db/schema";
import { resolveBookmarkSutraMeta } from "@/lib/bookmarks/enrich";

/** GET：获取书签列表（支持 ?sutra_id 过滤） */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sutraId = searchParams.get("sutra_id");
  const db = getDb();

  try {
    const baseQuery = db
      .select({
        id: bookmark.id,
        userId: bookmark.userId,
        sutraId: bookmark.sutraId,
        paragraphIndex: bookmark.paragraphIndex,
        content: bookmark.content,
        createdAt: bookmark.createdAt,
        updatedAt: bookmark.updatedAt,
        sutraSlug: sutra.slug,
        sutraTitle: sutra.title,
        sutraCbetaId: sutra.cbetaId,
      })
      .from(bookmark)
      .leftJoin(sutra, eq(bookmark.sutraId, sutra.id));

    const rows = sutraId
      ? await baseQuery
          .where(eq(bookmark.sutraId, sutraId))
          .orderBy(desc(bookmark.createdAt))
      : await baseQuery.orderBy(desc(bookmark.createdAt));

    const items = rows.map((row) => {
      const meta = resolveBookmarkSutraMeta(row.sutraSlug, row.sutraTitle, row.sutraCbetaId);
      return {
        id: row.id,
        userId: row.userId,
        sutraId: row.sutraId,
        paragraphIndex: row.paragraphIndex,
        content: row.content,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        sutraSlug: meta.sutraSlug,
        sutraTitle: meta.sutraTitle,
      };
    });

    return NextResponse.json({ bookmarks: items });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** 构建匿名/指定用户的 userId 匹配条件 */
function userMatch(userId: string | null | undefined) {
  if (userId) return eq(bookmark.userId, userId);
  return isNull(bookmark.userId);
}

/** POST：创建书签 */
export async function POST(req: Request) {
  const db = getDb();

  try {
    const body = await req.json();
    const {
      sutra_id,
      paragraph_index,
      content,
      userId,
    }: {
      sutra_id?: string;
      paragraph_index?: number;
      content?: string;
      userId?: string | null;
    } = body;

    if (!sutra_id || paragraph_index === undefined || paragraph_index === null) {
      return NextResponse.json(
        { error: "sutra_id 和 paragraph_index 为必填字段" },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = await db
      .select()
      .from(bookmark)
      .where(
        and(
          eq(bookmark.sutraId, sutra_id),
          eq(bookmark.paragraphIndex, paragraph_index),
          userMatch(userId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "该书签已存在", bookmark: existing[0] },
        { status: 409 }
      );
    }

    const now = Date.now();
    const newBookmark = {
      id: crypto.randomUUID(),
      userId: userId ?? null,
      sutraId: sutra_id,
      paragraphIndex: paragraph_index,
      content: content ?? null,
      createdAt: now,
      updatedAt: now,
    };

    const inserted = await db.insert(bookmark).values(newBookmark).returning();
    return NextResponse.json({ bookmark: inserted[0] }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE：删除书签（支持按 id 或 sutra_id + paragraph_index 删除） */
export async function DELETE(req: Request) {
  const db = getDb();

  try {
    const body = await req.json();
    const {
      id,
      sutra_id,
      paragraph_index,
      userId,
    }: {
      id?: string;
      sutra_id?: string;
      paragraph_index?: number;
      userId?: string | null;
    } = body;

    if (!id && (!sutra_id || paragraph_index === undefined)) {
      return NextResponse.json(
        { error: "需要提供 id 或 (sutra_id + paragraph_index)" },
        { status: 400 }
      );
    }

    if (id) {
      const deleted = await db
        .delete(bookmark)
        .where(eq(bookmark.id, id))
        .returning();
      if (deleted.length === 0) {
        return NextResponse.json({ error: "书签不存在" }, { status: 404 });
      }
      return NextResponse.json({ deleted: deleted[0] });
    }

    const deleted = await db
      .delete(bookmark)
      .where(
        and(
          eq(bookmark.sutraId, sutra_id!),
          eq(bookmark.paragraphIndex, paragraph_index!),
          userMatch(userId)
        )
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "书签不存在" }, { status: 404 });
    }
    return NextResponse.json({ deleted: deleted[0] });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
