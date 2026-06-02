/**
 * 本地收藏（localStorage）
 * @author jingxin
 */
export type BookmarkEntry = {
  id: string;
  targetType: "sutra" | "paragraph";
  sutraId: string;
  sutraSlug: string;
  sutraTitle: string;
  paragraphId?: string;
  paragraphSeq?: number;
  preview?: string;
  createdAt: number;
};

const STORAGE_KEY = "jx-bookmarks-v1";

export function loadBookmarks(): BookmarkEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as BookmarkEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveBookmarks(items: BookmarkEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addBookmark(entry: Omit<BookmarkEntry, "id" | "createdAt">) {
  const items = loadBookmarks();
  const exists = items.some(
    (b) =>
      b.targetType === entry.targetType &&
      b.sutraId === entry.sutraId &&
      b.paragraphId === entry.paragraphId,
  );
  if (exists) return items;
  const next: BookmarkEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
  };
  const updated = [next, ...items];
  saveBookmarks(updated);
  return updated;
}

export function removeBookmark(id: string) {
  const updated = loadBookmarks().filter((b) => b.id !== id);
  saveBookmarks(updated);
  return updated;
}

export function isBookmarked(sutraId: string, paragraphId?: string) {
  return loadBookmarks().some(
    (b) =>
      b.sutraId === sutraId &&
      (paragraphId ? b.paragraphId === paragraphId : b.targetType === "sutra"),
  );
}
