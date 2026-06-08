/**
 * 书签 React hook — 服务端 API + localStorage fallback
 * @author 代长亚
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadBookmarks as loadLocal,
  saveBookmarks as saveLocal,
  addBookmark as addLocal,
  removeBookmark as removeLocal,
  isBookmarked as isLocalBookmarked,
  type BookmarkEntry,
} from "@/lib/bookmarks/storage";

export type ServerBookmark = {
  id: string;
  userId: string | null;
  sutraId: string;
  paragraphIndex: number;
  content: string | null;
  createdAt: number;
  updatedAt: number;
  sutraSlug?: string;
  sutraTitle?: string;
};

export type BookmarkDisplay = BookmarkEntry & { serverId?: string };

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [useServer, setUseServer] = useState(false);
  const initRef = useRef(false);

  /** 加载书签：优先尝试服务端，失败则使用 localStorage */
  const loadBookmarks = useCallback(async (sutraId?: string) => {
    setLoading(true);
    try {
      const url = sutraId ? `/api/bookmarks?sutra_id=${encodeURIComponent(sutraId)}` : "/api/bookmarks";
      const res = await fetch(url);
      if (!res.ok) throw new Error("API 请求失败");
      const data = await res.json();
      const serverItems: BookmarkDisplay[] = (data.bookmarks ?? []).map(
        (b: ServerBookmark) => ({
          id: b.id,
          serverId: b.id,
          targetType: "paragraph" as const,
          sutraId: b.sutraId,
          sutraSlug: b.sutraSlug ?? "",
          sutraTitle: b.sutraTitle ?? "",
          paragraphSeq: b.paragraphIndex,
          preview: b.content ?? undefined,
          createdAt: b.createdAt,
        })
      );
      setBookmarks(serverItems);
      setUseServer(true);
    } catch {
      // 服务端不可用时 fallback 到 localStorage
      const localItems: BookmarkDisplay[] = loadLocal().map((b) => ({
        ...b,
      }));
      setBookmarks(localItems);
      setUseServer(false);
    } finally {
      setLoading(false);
    }
  }, []);

  /** 首次加载 */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    loadBookmarks();
  }, [loadBookmarks]);

  /** 添加书签 */
  const addBookmark = useCallback(
    async (entry: {
      sutraId: string;
      sutraSlug: string;
      sutraTitle: string;
      paragraphSeq?: number;
      paragraphId?: string;
      preview?: string;
    }) => {
      // 检查是否已存在
      const alreadyBookmarked = useServer
        ? bookmarks.some(
            (b) =>
              b.sutraId === entry.sutraId &&
              b.paragraphSeq === entry.paragraphSeq
          )
        : isLocalBookmarked(entry.sutraId, entry.paragraphId);

      if (alreadyBookmarked) return bookmarks;

      try {
        // 尝试服务端保存
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sutra_id: entry.sutraId,
            paragraph_index: entry.paragraphSeq ?? 0,
            content: entry.preview ?? null,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          if (res.status === 409) {
            // 已存在，直接返回
            return bookmarks;
          }
          throw new Error(errData.error ?? "保存失败");
        }

        const data = await res.json();
        const newEntry: BookmarkDisplay = {
          id: data.bookmark.id,
          serverId: data.bookmark.id,
          targetType: "paragraph",
          sutraId: data.bookmark.sutraId ?? data.bookmark.sutra_id,
          sutraSlug: entry.sutraSlug,
          sutraTitle: entry.sutraTitle,
          paragraphSeq: data.bookmark.paragraphIndex ?? data.bookmark.paragraph_index,
          preview: data.bookmark.content ?? undefined,
          createdAt: data.bookmark.createdAt ?? data.bookmark.created_at,
        };
        const next = [newEntry, ...bookmarks];
        setBookmarks(next);
        return next;
      } catch {
        // 服务端不可用时 fallback 到 localStorage
        const next = addLocal({
          targetType: "paragraph",
          sutraId: entry.sutraId,
          sutraSlug: entry.sutraSlug,
          sutraTitle: entry.sutraTitle,
          paragraphId: entry.paragraphId,
          paragraphSeq: entry.paragraphSeq,
          preview: entry.preview,
        });
        setBookmarks(next);
        return next;
      }
    },
    [bookmarks, useServer]
  );

  /** 删除书签 */
  const removeBookmark = useCallback(
    async (id: string) => {
      try {
        // 尝试服务端删除
        const isServerBookmark = bookmarks.some((b) => b.serverId === id);
        if (isServerBookmark) {
          await fetch("/api/bookmarks", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
          });
        } else {
          // 本地书签直接删除
        }
        const next = useServer
          ? bookmarks.filter((b) => b.id !== id)
          : removeLocal(id);
        setBookmarks(next);
        return next;
      } catch {
        // API 失败时 fallback 到 localStorage
        const next = removeLocal(id);
        setBookmarks(next);
        return next;
      }
    },
    [bookmarks, useServer]
  );

  /** 检查是否已收藏 */
  const isBookmarked = useCallback(
    (sutraId: string, paragraphSeq?: number) => {
      return bookmarks.some(
        (b) =>
          b.sutraId === sutraId &&
          (paragraphSeq !== undefined
            ? b.paragraphSeq === paragraphSeq
            : b.targetType === "sutra")
      );
    },
    [bookmarks]
  );

  return {
    bookmarks,
    loading,
    useServer,
    loadBookmarks,
    addBookmark,
    removeBookmark,
    isBookmarked,
  };
}
