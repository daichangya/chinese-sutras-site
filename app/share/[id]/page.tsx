import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getDb } from "@/lib/db";
import { share, sutra, paragraph } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { ShareCard } from "@/components/reader/share-card";
import { getMvpSlugByCbetaId } from "@/lib/cbeta/mvp-canon";

export const revalidate = 3600;

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const db = getDb();
  const { id: shareCode } = await params;
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

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

  if (!shareRow) notFound();

  // 增加浏览次数
  db.update(share)
    .set({ viewCount: sql`${share.viewCount} + 1` })
    .where(eq(share.shareCode, shareCode))
    .run();

  const sutraRow = db
    .select({
      title: sutra.title,
      cbetaId: sutra.cbetaId,
      slug: sutra.slug,
    })
    .from(sutra)
    .where(eq(sutra.id, shareRow.sutraId))
    .get();

  const paraRow = db
    .select({ seq: paragraph.seq })
    .from(paragraph)
    .where(eq(paragraph.id, shareRow.paragraphId))
    .get();

  if (!sutraRow) notFound();

  const friendlySlug =
    getMvpSlugByCbetaId(sutraRow.cbetaId) ?? sutraRow.slug;

  return (
    <ShareCard
      excerpt={shareRow.excerpt}
      sutraTitle={sutraRow.title}
      cbetaId={sutraRow.cbetaId}
      sutraSlug={friendlySlug}
      paragraphSeq={paraRow?.seq ?? 0}
      shareCode={shareCode}
      viewCount={shareRow.viewCount}
      baseUrl={baseUrl}
    />
  );
}
