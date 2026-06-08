"use client";

/**
 * 阅读器页客户端壳层（带 Error Boundary 包裹）
 * 从服务端 page.tsx 接收数据，用 Error Boundary 包裹 ReaderShell
 */
import { ErrorBoundary } from "@/components/error/error-boundary";
import { ReaderShell } from "@/components/reader/reader-shell";
import type { ParagraphRow, SutraRow } from "@/lib/sutra/queries";

export function SutraReaderClient({
  sutra,
  paragraphs,
  related,
  chapters,
  currentChapter,
}: {
  sutra: SutraRow;
  paragraphs: ParagraphRow[];
  related: SutraRow[];
  chapters: number[];
  currentChapter: number;
}) {
  return (
    <ErrorBoundary
      fallback={({ error, onReset }) => (
        <div className="jx-reader mx-auto px-4 py-8">
          <div
            role="alert"
            className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-deep)] p-10 text-center"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--jx-error-bg)]">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-7 w-7 text-[var(--jx-error)]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
              经文加载失败
            </h2>
            <p className="mb-2 max-w-md text-sm text-[var(--muted)]">
              此经典的正文部分加载出现问题，请重试或返回经典列表。
            </p>
            {error && (
              <p className="mb-4 max-w-sm rounded-lg bg-[var(--jx-paper)] px-3 py-2 text-xs font-mono text-[var(--jx-error)]">
                {error.message}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onReset}
                className="cursor-pointer rounded-full bg-[var(--jx-accent-cinnabar)] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--jx-accent-cinnabar-hover)]"
              >
                重试
              </button>
              <a
                href="/"
                className="rounded-full border border-[var(--jx-border)] px-5 py-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
              >
                返回经典列表
              </a>
            </div>
          </div>
        </div>
      )}
    >
      <ReaderShell
        sutra={sutra}
        paragraphs={paragraphs}
        related={related}
        chapters={chapters}
        currentChapter={currentChapter}
      />
    </ErrorBoundary>
  );
}
