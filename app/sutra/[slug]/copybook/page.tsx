import { notFound } from "next/navigation";
import { CopybookShell } from "@/components/copybook/copybook-shell";
import { isMvpSutra } from "@/lib/cbeta/mvp-canon";
import { getSqlite } from "@/lib/db";
import {
  countParagraphsForSutra,
  getParagraphsForSutra,
  getSutraBySlug,
  listChapterSeqsForSutra,
} from "@/lib/sutra/queries";

export const dynamic = "force-dynamic";

const PARAGRAPH_PAGE_LIMIT = 300;

/**
 * 抄经字帖页
 * @author jingxin
 */
export default async function CopybookPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ chapter?: string }>;
}) {
  getSqlite();
  const { slug } = await params;
  if (!isMvpSutra(slug)) notFound();

  const sutra = getSutraBySlug(slug);
  if (!sutra) notFound();

  const chapters = listChapterSeqsForSutra(sutra.id);
  const totalCount = countParagraphsForSutra(sutra.id);
  const needsPaging = totalCount > PARAGRAPH_PAGE_LIMIT || chapters.length > 1;

  let chapterSeq = 0;
  if (needsPaging) {
    const { chapter } = await searchParams;
    chapterSeq = chapter !== undefined ? parseInt(chapter, 10) : (chapters[0] ?? 0);
    if (Number.isNaN(chapterSeq) || !chapters.includes(chapterSeq)) {
      chapterSeq = chapters[0] ?? 0;
    }
  }

  const paragraphs = needsPaging
    ? getParagraphsForSutra(sutra.id, chapterSeq)
    : getParagraphsForSutra(sutra.id);

  return (
    <CopybookShell
      sutra={sutra}
      paragraphs={paragraphs}
      chapters={needsPaging ? chapters : []}
      currentChapter={chapterSeq}
    />
  );
}
