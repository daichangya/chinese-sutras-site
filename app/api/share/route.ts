/**
 * 分享 API — 创建/查询经文段落分享
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { getDb, getSqlite } from "@/lib/db";
import { share, sutra, paragraph } from "@/lib/db/schema";
import { getMvpSlugByCbetaId } from "@/lib/cbeta/mvp-canon";
import { getSutraBySlug } from "@/lib/sutra/queries";

/** 生成 8 位分享码 */
function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** POST：创建分享记录 */
export async function POST(req: Request) {
  getSqlite();
  const db = getDb();

  try {
    const body = await req.json();
    const {
      sutraSlug,
      paragraphId,
      paragraphSeq,
      text,
    }: {
      sutraSlug?: string;
      paragraphId?: string;
      paragraphSeq?: number;
      text?: string;
    } = body;

    if (!sutraSlug || !paragraphId) {
      return NextResponse.json(
        { error: "sutraSlug 和 paragraphId 为必填字段" },
        { status: 400 }
      );
    }

    const sutraRow = getSutraBySlug(sutraSlug);

    if (!sutraRow) {
      return NextResponse.json({ error: "经文不存在" }, { status: 404 });
    }

    // 检查是否已存在该段落的分享
    const existing = db
      .select()
      .from(share)
      .where(eq(share.paragraphId, paragraphId))
      .get();

    if (existing) {
      return NextResponse.json({
        shareCode: existing.shareCode,
        url: `/share/${existing.shareCode}`,
        excerpt: existing.excerpt,
        sutraTitle: sutraRow.title,
        cbetaId: sutraRow.cbetaId,
      });
    }

    const shareCode = generateShareCode();
    const excerpt = text?.slice(0, 500) ?? "";
    const now = Math.floor(Date.now() / 1000);

    const inserted = db
      .insert(share)
      .values({
        id: `share_${now}_${shareCode.toLowerCase()}`,
        sutraId: sutraRow.id,
        paragraphId,
        shareCode,
        excerpt,
        createdAt: now,
      })
      .returning()
      .get();

    return NextResponse.json(
      {
        shareCode: inserted.shareCode,
        url: `/share/${inserted.shareCode}`,
        excerpt: inserted.excerpt,
        sutraTitle: sutraRow.title,
        cbetaId: sutraRow.cbetaId,
      },
      { status: 201 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** GET：根据分享码获取分享内容 */
export async function GET(req: Request) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const shareCode = searchParams.get("code");

  if (!shareCode) {
    return NextResponse.json(
      { error: "code 参数为必填字段" },
      { status: 400 }
    );
  }

  try {
    const shareRow = db
      .select({
        shareCode: share.shareCode,
        excerpt: share.excerpt,
        sutraId: share.sutraId,
        paragraphId: share.paragraphId,
        createdAt: share.createdAt,
        viewCount: share.viewCount,
      })
      .from(share)
      .where(eq(share.shareCode, shareCode))
      .get();

    if (!shareRow) {
      return NextResponse.json({ error: "分享不存在或已过期" }, { status: 404 });
    }

    // 增加浏览次数
    db.update(share)
      .set({ viewCount: sql`${share.viewCount} + 1` })
      .where(eq(share.shareCode, shareCode))
      .run();

    // 关联 sutra 信息
    const sutraRow = db
      .select({
        title: sutra.title,
        cbetaId: sutra.cbetaId,
        slug: sutra.slug,
      })
      .from(sutra)
      .where(eq(sutra.id, shareRow.sutraId))
      .get();

    // 关联 paragraph seq
    const paraRow = db
      .select({ seq: paragraph.seq })
      .from(paragraph)
      .where(eq(paragraph.id, shareRow.paragraphId))
      .get();

    return NextResponse.json({
      ...shareRow,
      sutraTitle: sutraRow?.title ?? "",
      cbetaId: sutraRow?.cbetaId ?? "",
      sutraSlug: getMvpSlugByCbetaId(sutraRow?.cbetaId ?? "") ?? sutraRow?.slug ?? "",
      paragraphSeq: paraRow?.seq ?? 0,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
