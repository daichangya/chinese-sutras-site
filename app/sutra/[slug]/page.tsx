import { notFound } from "next/navigation";
import { ReaderShell } from "@/components/reader/reader-shell";
import { getSqlite } from "@/lib/db";
import {
  countParagraphsForSutra,
  getParagraphsForSutra,
  getRelatedSutras,
  getSutraBySlug,
  listChapterSeqsForSutra,
} from "@/lib/sutra/queries";

export const dynamic = "force-dynamic";

const PARAGRAPH_PAGE_LIMIT = 300;

export default async function SutraPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ chapter?: string }>;
}) {
  getSqlite();
  const { slug } = await params;
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

  const related = getRelatedSutras(sutra.id);

  return (
    <ReaderShell
      sutra={sutra}
      paragraphs={paragraphs}
      related={related}
      chapters={needsPaging ? chapters : []}
      currentChapter={chapterSeq}
    />
  );
}
