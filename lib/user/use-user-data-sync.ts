/**
 * 将 localStorage 书签/批注同步到 SQLite；登录后合并 deviceKey
 * @author 代长亚
 */
"use client";

import { useEffect } from "react";
import { fetchAuthSession, mergeDeviceData } from "@/lib/auth/client";
import { getDeviceKey } from "@/lib/reader/use-reading-progress";

async function syncLocalDataToServer(userKey: string) {
  const bookmarksRaw = localStorage.getItem("jingxin-bookmarks");
  const annotationsRaw = localStorage.getItem("jingxin:annotations");

  const bookmarks = bookmarksRaw ? (JSON.parse(bookmarksRaw) as Array<Record<string, string>>) : [];
  const annotations = annotationsRaw ? (JSON.parse(annotationsRaw) as Array<Record<string, string>>) : [];

  if (bookmarks.length === 0 && annotations.length === 0) return;

  await fetch("/api/user/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
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
  });
}

export function useUserDataSync() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const deviceKey = getDeviceKey();
      const session = await fetchAuthSession().catch(() => ({
        loggedIn: false,
        user: null,
      }));

      if (cancelled) return;

      if (session.loggedIn) {
        await mergeDeviceData(deviceKey).catch(() => {});
      }

      const userKey = session.loggedIn && session.user ? session.user.id : deviceKey;
      await syncLocalDataToServer(userKey).catch(() => {});
    })();

    return () => {
      cancelled = true;
    };
  }, []);
}
