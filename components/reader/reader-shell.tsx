"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GaijiText } from "@/components/reader/gaiji-text";
import { PinyinRubyText } from "@/components/reader/pinyin-ruby-text";
import { ReaderPreferences, ReadingProgress } from "@/components/reader/reader-preferences";
import { ChapterNav } from "@/components/reader/chapter-nav";
import { ParagraphNoteButton } from "@/components/reader/paragraph-notes";
import { SelectionPanel } from "@/components/reader/selection-panel";
import { Button } from "@/components/ui/button";
import { addBookmark, isBookmarked } from "@/lib/bookmarks/storage";
import { isMvpSutra } from "@/lib/cbeta/mvp-canon";
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

  useEffect(() => {
    setShowPinyin(localStorage.getItem("jx-pinyin") === "1");
    setShowTraditional(localStorage.getItem("jx-traditional") === "1");
  }, []);
  const hasColloquial = paragraphs.some((p) => p.colloquial);
  const [bookmarked, setBookmarked] = useState(false);
  const [activeParagraphId, setActiveParagraphId] = useState(paragraphs[0]?.id);

  /** 按需转换繁体文本 */
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
    return () => { cancelled = true; };
  }, [showTraditional, vernacular]);

  function toggleBookmark() {
    addBookmark({
      targetType: "sutra",
      sutraId: sutra.id,
      sutraSlug: sutra.slug,
      sutraTitle: sutra.title,
    });
    setBookmarked(true);
  }

  function handleReaderMouseUp(event: React.MouseEvent) {
    const el = (event.target as HTMLElement).closest("[data-paragraph-id]");
    const pid = el?.getAttribute("data-paragraph-id");
    if (pid) setActiveParagraphId(pid);
  }

  function getDisplayText(p: ParagraphRow): string {
    const raw = vernacular && p.colloquial ? p.colloquial : p.text;
    if (showTraditional) return traditionalTexts[p.id] ?? raw;
    return raw;
  }

  return (
    <>
      <ReadingProgress />
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* 经头 — 无尽藏式仪式感 */}
        <header className="mb-8 pb-6 border-b border-[var(--jx-border)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-[var(--jx-muted-label)] tracking-wider">
                  {sutra.cbetaId}
                </span>
                {sutra.category && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--jx-paper-deep)] text-[var(--muted)]">
                    {sutra.category}
                  </span>
                )}
              </div>
              <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[var(--foreground)]">
                {sutra.title}
              </h1>
              {sutra.translator && (
                <p className="mt-2 text-sm text-[var(--muted)] italic">
                  {sutra.translator}
                  {sutra.charCount ? ` · 约 ${sutra.charCount.toLocaleString()} 字` : ""}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <ReaderPreferences onPinyinChange={setShowPinyin} />
              <Button
                variant="outline"
                size="sm"
                type="button"
                className={`text-xs rounded-full ${showTraditional ? "bg-amber-800 text-white hover:bg-amber-900 border-amber-800" : ""}`}
                onClick={() => {
                  setShowTraditional((v) => !v);
                  localStorage.setItem("jx-traditional", showTraditional ? "0" : "1");
                }}
              >
                {showTraditional ? "简体" : "繁体"}
              </Button>
              {hasColloquial && (
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className={`text-xs rounded-full ${vernacular ? "bg-amber-800 text-white hover:bg-amber-900 border-amber-800" : ""}`}
                  onClick={() => setVernacular((v) => !v)}
                >
                  {vernacular ? "原文" : "白话"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                type="button"
                className={`text-xs rounded-full ${bookmarked || isBookmarked(sutra.id) ? "text-amber-800 border-amber-300" : ""}`}
                onClick={toggleBookmark}
                disabled={bookmarked || isBookmarked(sutra.id)}
              >
                {bookmarked || isBookmarked(sutra.id) ? "已收藏" : "收藏"}
              </Button>
              {isMvpSutra(sutra.slug) && (
                <Link
                  href={`/sutra/${sutra.slug}/copybook${chapters.length > 0 ? `?chapter=${currentChapter}` : ""}`}
                  className="inline-flex h-8 items-center rounded-full border border-amber-300 bg-amber-50 px-3 text-xs font-medium text-amber-900 hover:bg-amber-100"
                  data-testid="reader-copybook-link"
                >
                  开始抄经
                </Link>
              )}
              <Link
                href="/"
                className="text-xs text-[var(--jx-muted-label)] hover:text-[var(--foreground)] transition-colors px-2"
              >
                返回首页
              </Link>
            </div>
          </div>
        </header>

        {/* 卷导航 */}
        <ChapterNav
          slug={sutra.slug}
          chapters={chapters}
          current={currentChapter}
          totalParagraphs={paragraphs.length}
        />

        {/* 正文 + AI 侧栏 */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_var(--jx-sidebar-width)]">
          {/* 正文 — 无尽藏式沉浸阅读 */}
          <article
            className="prose-jx reader-body animate-jx-fade-slow"
            id="reader-content"
            onMouseUp={handleReaderMouseUp}
          >
            {paragraphs.map((p, idx) => (
              <p
                key={p.id}
                id={`p-${p.seq}`}
                data-paragraph-id={p.id}
                className={`group relative ${idx === 0 ? "animate-jx-fade" : ""}`}
                style={idx === 0 ? { animationDelay: "100ms" } : {}}
              >
                {showPinyin ? (
                  <PinyinRubyText text={getDisplayText(p)} />
                ) : (
                  <GaijiText text={getDisplayText(p)} />
                )}
                <ParagraphNoteButton sutraId={sutra.id} paragraphId={p.id} excerpt={p.text} />
              </p>
            ))}
          </article>

          {/* AI 侧栏 — 大藏经AI式解释面板 */}
          <SelectionPanel sutraTitle={sutra.title} paragraphId={activeParagraphId} />
        </div>

        {/* 相关经典 */}
        {related.length > 0 && (
          <section className="mt-12 pt-8 border-t border-[var(--jx-border)]">
            <div className="flex items-center gap-3 mb-4">
              <p className="jx-section-label">相关经典</p>
              <div className="h-px flex-1 bg-gradient-to-r from-[var(--jx-border)] to-transparent" />
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
    </>
  );
}
