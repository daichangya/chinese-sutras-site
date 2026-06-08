import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { share } from "@/lib/db/schema";
import type { ParagraphRow, SutraRow } from "@/lib/sutra/queries";

/** 生成 8 位分享码 */
function generateShareCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/** 创建分享记录 */
export async function createShare({
  sutra,
  paragraph,
}: {
  sutra: SutraRow;
  paragraph: ParagraphRow;
}): Promise<{ shareCode: string; url: string }> {
  const db = getDb();
  // 检查是否已存在该段落的分享
  const existing = db
    .select()
    .from(share)
    .where(eq(share.paragraphId, paragraph.id))
    .get();

  if (existing) {
    return {
      shareCode: existing.shareCode,
      url: `/share/${existing.shareCode}`,
    };
  }

  const shareCode = generateShareCode();
  const excerpt = paragraph.text.slice(0, 200);

  db.insert(share).values({
    id: `share_${Date.now()}_${shareCode.toLowerCase()}`,
    sutraId: sutra.id,
    paragraphId: paragraph.id,
    shareCode,
    excerpt,
    createdAt: Math.floor(Date.now() / 1000),
  });

  return { shareCode, url: `/share/${shareCode}` };
}

/** 根据分享码获取分享详情 */
export async function getShareByCode(shareCode: string) {
  const db = getDb();
  const result = db
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

  return result;
}

/** 增加浏览次数 */
export function incrementShareView(shareCode: string) {
  const db = getDb();
  db.update(share)
    .set({ viewCount: sql`${share.viewCount} + 1` })
    .where(eq(share.shareCode, shareCode))
    .run();
}
