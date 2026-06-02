/**
 * 收藏页 — 统一视觉
 * @author jingxin
 */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { loadBookmarks, removeBookmark, type BookmarkEntry } from "@/lib/bookmarks/storage";

export default function BookmarksPage() {
  const [items, setItems] = useState<BookmarkEntry[]>([]);

  useEffect(() => {
    setItems(loadBookmarks());
  }, []);

  return (
    <div className="jx-page animate-jx-fade">
      <header className="mb-8">
        <p className="jx-section-label">阅读</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">我的收藏</h1>
      </header>
      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[var(--muted)] text-lg">暂无收藏</p>
          <p className="text-sm text-[var(--jx-muted-label)] mt-2">在阅读页点击「收藏」即可保存经文或段落</p>
          <Link href="/" className="inline-block mt-6 text-sm text-amber-800 dark:text-amber-400 underline underline-offset-4">
            去阅读经典
          </Link>
        </div>
      ) : (
        <ul data-testid="bookmarks-list" className="space-y-3">
          {items.map((b) => (
            <li key={b.id} className="animate-jx-fade">
              <div className="jx-sutra-card flex items-start justify-between gap-4 px-5 py-5">
                <div className="min-w-0 flex-1">
                  <Link
                    href={
                      b.paragraphId && b.paragraphSeq
                        ? `/sutra/${b.sutraSlug}#p-${b.paragraphSeq}`
                        : `/sutra/${b.sutraSlug}`
                    }
                    className="font-medium text-amber-900 underline-offset-2 hover:underline dark:text-amber-400"
                  >
                    {b.sutraTitle}
                  </Link>
                  {b.preview && (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">{b.preview}</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => setItems(removeBookmark(b.id))} className="shrink-0">
                  删除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
