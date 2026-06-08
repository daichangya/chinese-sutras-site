"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GaijiText } from "@/components/reader/gaiji-text";
import { PinyinRubyText } from "@/components/reader/pinyin-ruby-text";
import { ReadingProgress, useReaderPrefsInit } from "@/components/reader/reader-preferences";
import { ReaderToolbar, type ReaderPanel } from "@/components/reader/reader-toolbar";
import { ReaderPanelDrawer } from "@/components/reader/reader-panel-drawer";
import { ChapterNav } from "@/components/reader/chapter-nav";
import { ComprehensionPanel } from "@/components/reader/comprehension-panel";
import { ShareDialog } from "@/components/reader/share-dialog";
import { ReaderToc } from "@/components/reader/reader-toc";
import { useBookmarks } from "@/lib/bookmarks/use-bookmarks";
import { getReaderTextSelection } from "@/lib/reader/reader-selection";
import { useReadingProgress } from "@/lib/reader/use-reading-progress";
import type { ParagraphRow, SutraRow } from "@/lib/sutra/queries";

/** 简体 → 繁体（按需转换，不存 DB） */
async function s2tText(text: string): Promise<string> {
  const res = await fetch("/api/convert/s2t", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 2000) }),
  });
  if (!res.ok) return text;
  const data = await res.json();
  return data.text ?? text;
}

export function ReaderShell({
  sutra,
  paragraphs,
  related,
  chapters = [],
  currentChapter = 0,
}: {
  sutra: SutraRow;
  paragraphs: ParagraphRow[];
  related: SutraRow[];
  chapters?: number[];
  currentChapter?: number;
}) {
  const [vernacular, setVernacular] = useState(false);
  const [showPinyin, setShowPinyin] = useState(false);
  const [showTraditional, setShowTraditional] = useState(false);
  const [traditionalTexts, setTraditionalTexts] = useState<Record<string, string>>({});
  type TranslatorPerson = {
    id: string;
    slug?: string;
    name_zh: string;
    name_en: string | null;
    properties: string | null;
  };
  const [translatorPerson, setTranslatorPerson] = useState<TranslatorPerson | null>(null);
  const [translatorLabel, setTranslatorLabel] = useState<string | null>(sutra.translator);

  useReaderPrefsInit(setShowPinyin);

  useEffect(() => {
    setShowTraditional(localStorage.getItem("jx-traditional") === "1");
  }, []);

  useEffect(() => {
    if (!sutra.cbetaId) return;
    let cancelled = false;
    fetch(`/api/kg/person?cbeta_id=${encodeURIComponent(sutra.cbetaId)}`)
      .then((r) => r.json())
      .then((data: { person?: TranslatorPerson | null; translatorLabel?: string | null }) => {
        if (!cancelled) {
          setTranslatorPerson(data.person ?? null);
          setTranslatorLabel(data.translatorLabel ?? sutra.translator);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [sutra.cbetaId]);

  useEffect(() => {
    function syncReaderSelection() {
      const readerSelection = getReaderTextSelection();
      if (readerSelection) {
        setSelectedText(readerSelection.text);
        if (readerSelection.paragraphId) {
          setActiveParagraphId(readerSelection.paragraphId);
        }
      }
    }

    document.addEventListener("selectionchange", syncReaderSelection);
    return () => document.removeEventListener("selectionchange", syncReaderSelection);
  }, []);

  const hasColloquial = paragraphs.some((p) => p.colloquial);
  const { addBookmark, isBookmarked, loading: bookmarksLoading } = useBookmarks();
  const [activeParagraphId, setActiveParagraphId] = useState(paragraphs[0]?.id);
  const [selectedText, setSelectedText] = useState("");
  const [shareParagraph, setShareParagraph] = useState<ParagraphRow | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<ReaderPanel>(null);
  const [, bumpFont] = useState(0);

  function openShareDialog(p: ParagraphRow) {
    setShareParagraph(p);
    setShareOpen(true);
  }

  useEffect(() => {
    if (!showTraditional) return;
    let cancelled = false;
    const convert = async () => {
      const result: Record<string, string> = {};
      for (const p of paragraphs) {
        const display = vernacular && p.colloquial ? p.colloquial : p.text;
        if (!traditionalTexts[p.id]) {
          result[p.id] = await s2tText(display);
        }
      }
      if (!cancelled && Object.keys(result).length > 0) {
        setTraditionalTexts((prev) => ({ ...prev, ...result }));
      }
    };
    convert();
    return () => {
      cancelled = true;
    };
  }, [showTraditional, vernacular, paragraphs]);

  const alreadyBookmarked = isBookmarked(sutra.id);

  useReadingProgress({
    sutraId: sutra.id,
    sutraSlug: sutra.slug,
    sutraTitle: sutra.title,
    activeParagraphId,
  });

  async function toggleBookmark() {
    if (alreadyBookmarked) return;
    await addBookmark({
      sutraId: sutra.id,
      sutraSlug: sutra.slug,
      sutraTitle: sutra.title,
    });
  }

  function handleReaderMouseUp(event: React.MouseEvent) {
    const el = (event.target as HTMLElement).closest("[data-paragraph-id]");
    const pid = el?.getAttribute("data-paragraph-id");
    if (pid) setActiveParagraphId(pid);

    const readerSelection = getReaderTextSelection();
    if (readerSelection) {
      setSelectedText(readerSelection.text);
      if (readerSelection.paragraphId) {
        setActiveParagraphId(readerSelection.paragraphId);
      }
    }
  }

  function getDisplayText(p: ParagraphRow): string {
    const raw = vernacular && p.colloquial ? p.colloquial : p.text;
    if (showTraditional) return traditionalTexts[p.id] ?? raw;
    return raw;
  }

  return (
    <>
      <ReadingProgress />
      <div className="jx-reader mx-auto px-3 md:px-4 py-6 md:py-8">
        <header className="mb-6 md:mb-8 pb-6 border-b border-[var(--jx-border)]/40">
          <div className="flex flex-wrap items-start justify-between gap-3 md:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--jx-muted-label)] tracking-wider">
                <span>{sutra.cbetaId}</span>
                {sutra.category && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="rounded-full bg-[var(--jx-paper-deep)] px-2 py-0.5 text-[var(--muted)]">
                      {sutra.category}
                    </span>
                  </>
                )}
              </div>
              <h1 className="mt-2 text-2xl md:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                {sutra.title}
              </h1>
              {(translatorLabel || translatorPerson?.name_zh || sutra.charCount) && (
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {[
                    translatorPerson?.name_zh ?? translatorLabel,
                    sutra.charCount ? `约 ${sutra.charCount} 字` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>
            <div className="w-full xl:w-auto">
              <ReaderToolbar
                activePanel={activePanel}
                onOpenPanel={setActivePanel}
                onFontDown={() => bumpFont((n) => n + 1)}
                onFontUp={() => bumpFont((n) => n + 1)}
                onBookmark={toggleBookmark}
                onShare={() => {
                  const p = paragraphs.find((x) => x.id === activeParagraphId) ?? paragraphs[0];
                  if (p) openShareDialog(p);
                }}
                bookmarked={alreadyBookmarked}
                bookmarkDisabled={bookmarksLoading}
                parallelHref={`/parallel/${sutra.slug}`}
                copybookHref={`/sutra/${sutra.slug}/copybook${chapters.length > 0 ? `?chapter=${currentChapter}` : ""}`}
                hasColloquial={hasColloquial}
                vernacular={vernacular}
                onToggleVernacular={() => setVernacular((v) => !v)}
                showTraditional={showTraditional}
                onToggleTraditional={() => {
                  setShowTraditional((v) => !v);
                  localStorage.setItem("jx-traditional", showTraditional ? "0" : "1");
                }}
                onPinyinChange={setShowPinyin}
              />
            </div>
          </div>
        </header>

        <ChapterNav
          slug={sutra.slug}
          chapters={chapters}
          current={currentChapter}
          totalParagraphs={paragraphs.length}
        />

        <div className="flex flex-col xl:flex-row xl:gap-6">
          <ReaderToc
            sutraSlug={sutra.slug}
            paragraphs={paragraphs}
            activeParagraphId={activeParagraphId}
            chapters={chapters}
            currentChapter={currentChapter}
          />

          <div className="flex min-w-0 flex-1 flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_var(--jx-sidebar-width)] lg:gap-10">
            <article
              className="prose-jx reader-body animate-jx-fade-s"
              id="reader-content"
              aria-label={`${sutra.title} - 正文`}
              onMouseUp={handleReaderMouseUp}
            >
              {paragraphs.map((p, idx) => (
                <p
                  key={p.id}
                  id={`p-${p.seq}`}
                  data-paragraph-id={p.id}
                  className={idx === 0 ? "animate-jx-fade" : undefined}
                  style={idx === 0 ? { animationDelay: "100ms" } : undefined}
                >
                  {showPinyin ? (
                    <PinyinRubyText text={getDisplayText(p)} />
                  ) : (
                    <GaijiText text={getDisplayText(p)} />
                  )}
                </p>
              ))}
            </article>

            <div className="hidden xl:block">
              <ComprehensionPanel
                selection={selectedText}
                onSelectionChange={setSelectedText}
                sutraTitle={sutra.title}
                sutraSlug={sutra.slug}
                paragraphId={activeParagraphId}
                translatorLabel={translatorLabel}
                translatorPerson={translatorPerson}
              />
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-12 pt-8 border-t border-[var(--jx-border)]/40">
            <div className="flex items-center gap-3 mb-4">
              <p className="jx-section-label">相关经典</p>
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--jx-border)]/40 to-transparent" />
            </div>
            <ul className="flex flex-wrap gap-3">
              {related.map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/sutra/${r.slug}`}
                    className="jx-sutra-card inline-block px-4 py-2 text-sm rounded-lg transition-colors"
                  >
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <ReaderPanelDrawer panel={activePanel} onClose={() => setActivePanel(null)}>
        {activePanel === "toc" && (
          <ReaderToc
            variant="embedded"
            sutraSlug={sutra.slug}
            paragraphs={paragraphs}
            activeParagraphId={activeParagraphId}
            chapters={chapters}
            currentChapter={currentChapter}
          />
        )}
        {activePanel === "comprehension" && (
          <ComprehensionPanel
            selection={selectedText}
            onSelectionChange={setSelectedText}
            sutraTitle={sutra.title}
            sutraSlug={sutra.slug}
            paragraphId={activeParagraphId}
            translatorLabel={translatorLabel}
            translatorPerson={translatorPerson}
          />
        )}
      </ReaderPanelDrawer>

      <ShareDialog
        paragraph={
          shareParagraph
            ? {
                id: shareParagraph.id,
                seq: shareParagraph.seq,
                text: shareParagraph.text,
                sutraTitle: sutra.title,
                sutraSlug: sutra.slug,
                cbetaId: sutra.cbetaId,
              }
            : null
        }
        open={shareOpen}
        onOpenChange={setShareOpen}
      />
    </>
  );
}
