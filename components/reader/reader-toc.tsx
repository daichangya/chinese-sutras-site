/**
 * 阅读器目录侧栏
 * @author 代长亚
 */
"use client";

import Link from "next/link";
import type { ParagraphRow } from "@/lib/sutra/queries";

export function ReaderToc({
  paragraphs,
  activeParagraphId,
  chapters,
  currentChapter,
  variant = "sidebar",
  onNavigateParagraph,
  getChapterHref,
  onAfterNavigate,
}: {
  paragraphs: ParagraphRow[];
  activeParagraphId?: string;
  chapters: number[];
  currentChapter: number;
  variant?: "sidebar" | "embedded";
  onNavigateParagraph: (seq: number) => void;
  getChapterHref: (chapterSeq: number) => string;
  onAfterNavigate?: () => void;
}) {
  const sample = paragraphs.filter((_, i) => i % Math.max(1, Math.floor(paragraphs.length / 12)) === 0);

  function handleParagraphClick(seq: number) {
    onNavigateParagraph(seq);
    onAfterNavigate?.();
  }

  const inner = (
    <>
      {variant === "sidebar" && <p className="jx-section-label mb-3 px-1">目录</p>}
      {chapters.length > 1 && (
        <ul className="mb-3 space-y-1 border-b border-[var(--jx-border)] pb-3">
          {chapters.map((c) => (
            <li key={c}>
              <Link
                href={getChapterHref(c)}
                className={`block rounded-md px-2 py-1.5 text-xs transition-colors ${
                  c === currentChapter
                    ? "bg-[var(--jx-accent-cinnabar)]/10 text-[var(--jx-accent-cinnabar)]"
                    : "text-[var(--muted)] hover:bg-[var(--jx-paper-deep)]"
                }`}
                data-testid={c === currentChapter ? "reader-toc-chapter-active" : `reader-toc-chapter-${c}`}
              >
                {c === 0 ? "全文" : `第 ${c} 卷`}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <ul className="space-y-0.5" data-testid="reader-toc-paragraphs">
        {(sample.length > 0 ? sample : paragraphs.slice(0, 15)).map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => handleParagraphClick(p.seq)}
              className={`block w-full truncate rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                p.id === activeParagraphId
                  ? "bg-[var(--jx-accent-cinnabar)]/10 font-medium text-[var(--jx-accent-cinnabar)]"
                  : "text-[var(--muted)] hover:bg-[var(--jx-paper-deep)] hover:text-[var(--foreground)]"
              }`}
              data-testid={`reader-toc-item-${p.seq}`}
            >
              {p.text.slice(0, 18)}
              {p.text.length > 18 ? "…" : ""}
            </button>
          </li>
        ))}
      </ul>
    </>
  );

  if (variant === "embedded") {
    return <div aria-label="目录导航">{inner}</div>;
  }

  return (
    <aside className="hidden xl:block w-48 shrink-0" aria-label="目录导航" data-testid="reader-toc-sidebar">
      <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-[var(--jx-border)] bg-[var(--jx-sidebar-bg)] p-3">
        {inner}
      </div>
    </aside>
  );
}
