/**
 * 阅读进度持久化（localStorage userKey + API）
 * @author 代长亚
 */
"use client";

import { useEffect, useRef } from "react";

const USER_KEY_STORAGE = "jingxin-device-id";

export function getUserKey(): string {
  if (typeof window === "undefined") return "server";
  let key = localStorage.getItem(USER_KEY_STORAGE);
  if (!key) {
    key = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(USER_KEY_STORAGE, key);
  }
  return key;
}

export function useReadingProgress({
  sutraId,
  sutraSlug,
  sutraTitle,
  activeParagraphId,
}: {
  sutraId: string;
  sutraSlug: string;
  sutraTitle: string;
  activeParagraphId?: string;
}) {
  const restoredRef = useRef(false);

  useEffect(() => {
    if (restoredRef.current) return;
    const userKey = getUserKey();
    fetch(
      `/api/reading/progress?userKey=${encodeURIComponent(userKey)}&sutraId=${encodeURIComponent(sutraId)}`,
    )
      .then((r) => r.json())
      .then((data: { progress?: { paragraphId: string } | null }) => {
        if (restoredRef.current || !data.progress?.paragraphId) return;
        const target = document.querySelector(
          `[data-paragraph-id="${data.progress.paragraphId}"]`,
        );
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          restoredRef.current = true;
        }
      })
      .catch(() => {});
  }, [sutraId]);

  useEffect(() => {
    if (!activeParagraphId) return;
    const userKey = getUserKey();
    const timer = window.setTimeout(() => {
      fetch("/api/reading/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userKey,
          sutraId,
          sutraSlug,
          sutraTitle,
          paragraphId: activeParagraphId,
          scrollY: window.scrollY,
        }),
      }).catch(() => {});
    }, 800);
    return () => window.clearTimeout(timer);
  }, [activeParagraphId, sutraId, sutraSlug, sutraTitle]);
}
