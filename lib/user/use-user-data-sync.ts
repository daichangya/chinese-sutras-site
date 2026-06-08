/**
 * 将 localStorage 书签/批注同步到 SQLite
 * @author 代长亚
 */
"use client";

import { useEffect } from "react";
import { getUserKey } from "@/lib/reader/use-reading-progress";

export function useUserDataSync() {
  useEffect(() => {
    const userKey = getUserKey();
    const bookmarksRaw = localStorage.getItem("jingxin-bookmarks");
    const annotationsRaw = localStorage.getItem("jingxin:annotations");

    const bookmarks = bookmarksRaw ? (JSON.parse(bookmarksRaw) as Array<Record<string, string>>) : [];
    const annotations = annotationsRaw ? (JSON.parse(annotationsRaw) as Array<Record<string, string>>) : [];

    if (bookmarks.length === 0 && annotations.length === 0) return;

    fetch("/api/user/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userKey,
        bookmarks: bookmarks.map((b) => ({
          id: String(b.id ?? `${b.sutraId}-${Date.now()}`),
          sutraId: String(b.sutraId ?? ""),
          sutraSlug: String(b.sutraSlug ?? ""),
          sutraTitle: String(b.sutraTitle ?? ""),
          paragraphId: b.paragraphId ? String(b.paragraphId) : undefined,
          createdAt: Number(b.createdAt ?? Date.now()),
        })),
        annotations: annotations.map((a) => ({
          id: String(a.id ?? `${a.sutraId}-${a.paragraphId}`),
          sutraId: String(a.sutraId ?? ""),
          paragraphId: String(a.paragraphId ?? ""),
          quote: String(a.excerpt ?? a.quote ?? ""),
          note: a.note ? String(a.note) : undefined,
          createdAt: Number(a.createdAt ?? Date.now()),
        })),
      }),
    }).catch(() => {});
  }, []);
}
