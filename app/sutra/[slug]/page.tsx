import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SutraReaderClient } from "@/components/reader/reader-client";
import { brandPageTitleSuffix, getBrandName } from "@/lib/brand";
import { getSqlite } from "@/lib/db";
import {
  countParagraphsForSutra,
  getAuxiliaryParagraphsForSutra,
  getParagraphsForSutra,
  getRelatedSutras,
  getSutraBySlug,
  isCorpusMounted,
  listChapterSeqsForSutra,
} from "@/lib/sutra/queries";

export const revalidate = 86400;

const cachedGetSutraBySlug = cache(getSutraBySlug);

const PARAGRAPH_PAGE_LIMIT = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  getSqlite();
  const { slug } = await params;
  const sutra = cachedGetSutraBySlug(slug);
  if (!sutra) return { title: `经文 | ${brandPageTitleSuffix()}` };
  const brandName = getBrandName();
  return {
    title: `${sutra.title} | ${brandName}`,
    description: `${sutra.title}${sutra.translator ? ` — ${sutra.translator}` : ""}。现代化阅读，白话与 AI 辅助理解。`,
    openGraph: {
      title: sutra.title,
      description: sutra.translator ?? `${brandName}佛经阅读`,
    },
  };
}

export default async function SutraPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ chapter?: string }>;
}) {
  getSqlite();
  const { slug } = await params;
  const sutra = cachedGetSutraBySlug(slug);
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
  const auxiliaryParagraphs = needsPaging
    ? getAuxiliaryParagraphsForSutra(sutra.id, chapterSeq)
    : getAuxiliaryParagraphsForSutra(sutra.id);

  const related = getRelatedSutras(sutra.id);
  const corpusMissing = !isCorpusMounted();

  return (
    <>
      {corpusMissing && (
        <p className="mx-auto max-w-3xl px-4 py-3 text-sm text-[var(--jx-accent-cinnabar)] bg-[rgb(139_37_0/0.06)] border border-[var(--jx-border)] rounded-md">
          语料目录未挂载（请设置 CORPUS_DIR）。段落正文无法从 chinese-sutras-md 加载。
        </p>
      )}
      <SutraReaderClient
        sutra={sutra}
        paragraphs={paragraphs}
        auxiliaryParagraphs={auxiliaryParagraphs}
        related={related}
        chapters={needsPaging ? chapters : []}
        currentChapter={chapterSeq}
      />
    </>
  );
}
