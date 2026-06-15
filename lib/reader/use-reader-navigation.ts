/**
 * 阅读器统一导航（段落跳转、hash、阅读进度恢复、分卷 URL）
 * @author 代长亚
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildChapterHref,
  navigateToParagraph,
  parseParagraphHash,
} from "@/lib/reader/paragraph-navigation";
import { getUserKey } from "@/lib/reader/use-reading-progress";
import type { ParagraphRow } from "@/lib/sutra/queries";

export function useReaderNavigation({
  paragraphs,
  sutraSlug,
  sutraId,
}: {
  paragraphs: ParagraphRow[];
  sutraSlug: string;
  sutraId: string;
}) {
  const [activeParagraphId, setActiveParagraphId] = useState(paragraphs[0]?.id);
  const initialScrollDoneRef = useRef(false);

  useEffect(() => {
    setActiveParagraphId(paragraphs[0]?.id);
    initialScrollDoneRef.current = false;
  }, [paragraphs, sutraId]);

  const goToParagraph = useCallback(
    (seq: number, options?: { behavior?: ScrollBehavior; block?: ScrollLogicalPosition }) => {
      const id = navigateToParagraph(paragraphs, seq, options);
      if (id) setActiveParagraphId(id);
      return id;
    },
    [paragraphs],
  );

  const goToParagraphId = useCallback(
    (paragraphId: string, options?: { behavior?: ScrollBehavior; block?: ScrollLogicalPosition }) => {
      const paragraph = paragraphs.find((p) => p.id === paragraphId);
      if (paragraph) return goToParagraph(paragraph.seq, options);
      setActiveParagraphId(paragraphId);
      return paragraphId;
    },
    [goToParagraph, paragraphs],
  );

  const getChapterHref = useCallback(
    (chapterSeq: number) => buildChapterHref(sutraSlug, chapterSeq),
    [sutraSlug],
  );

  useEffect(() => {
    if (initialScrollDoneRef.current || paragraphs.length === 0) return;
    let cancelled = false;

    async function restoreInitialPosition() {
      const hashSeq =
        typeof window !== "undefined" ? parseParagraphHash(window.location.hash) : null;

      if (hashSeq != null) {
        const id = goToParagraph(hashSeq, { behavior: "auto", block: "start" });
        if (id) {
          initialScrollDoneRef.current = true;
          return;
        }
      }

      const userKey = getUserKey();
      try {
        const res = await fetch(
          `/api/reading/progress?userKey=${encodeURIComponent(userKey)}&sutraId=${encodeURIComponent(sutraId)}`,
        );
        const data = (await res.json()) as { progress?: { paragraphId: string } | null };
        if (cancelled || initialScrollDoneRef.current || !data.progress?.paragraphId) return;

        const paragraph = paragraphs.find((p) => p.id === data.progress!.paragraphId);
        if (paragraph) {
          goToParagraph(paragraph.seq, { behavior: "smooth", block: "start" });
        } else {
          const target = document.querySelector(
            `[data-paragraph-id="${data.progress.paragraphId}"]`,
          );
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            setActiveParagraphId(data.progress.paragraphId);
          }
        }
      } catch {
        // ignore restore errors
      } finally {
        if (!cancelled) initialScrollDoneRef.current = true;
      }
    }

    void restoreInitialPosition();
    return () => {
      cancelled = true;
    };
  }, [goToParagraph, paragraphs, sutraId]);

  return {
    activeParagraphId,
    setActiveParagraphId,
    goToParagraph,
    goToParagraphId,
    getChapterHref,
  };
}
