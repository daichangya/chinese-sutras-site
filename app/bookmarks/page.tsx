/**
 * 收藏页 — 服务端数据 + localStorage fallback
 * @author 代长亚
 */
"use client";

import Link from "next/link";
import { DiscoveryLayout } from "@/components/layout/discovery-layout";
import { Button } from "@/components/ui/button";
import { useBookmarks, type BookmarkDisplay } from "@/lib/bookmarks/use-bookmarks";

export default function BookmarksPage() {
  const { bookmarks, loading, removeBookmark, useServer } = useBookmarks();

  if (loading) {
    return (
      <DiscoveryLayout label="阅读" title="我的收藏">
        <div className="py-16 text-center">
          <p className="text-lg text-[var(--muted)]">加载中...</p>
        </div>
      </DiscoveryLayout>
    );
  }

  return (
    <DiscoveryLayout
      label="阅读"
      title="我的收藏"
      description={
        !useServer && bookmarks.length > 0
          ? "当前使用本地存储（服务端不可用时自动降级）"
          : undefined
      }
    >
      {bookmarks.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-[var(--muted)]">暂无收藏</p>
          <p className="mt-2 text-sm text-[var(--jx-muted-label)]">
            在阅读页点击「收藏」即可保存经文或段落
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-sm text-[var(--jx-accent-cinnabar)] underline underline-offset-4 dark:text-[var(--jx-gold)]"
          >
            去阅读经典
          </Link>
        </div>
      ) : (
        <ul data-testid="bookmarks-list" className="space-y-3">
          {bookmarks.map((b: BookmarkDisplay) => (
            <li key={b.id} className="animate-jx-fade">
              <div className="jx-sutra-card flex flex-col items-start justify-between gap-3 px-4 py-4 sm:flex-row sm:gap-4 sm:px-5 sm:py-5">
                <div className="min-w-0 flex-1">
                  {b.sutraSlug ? (
                    <Link
                      href={
                        b.paragraphSeq
                          ? `/sutra/${b.sutraSlug}#p-${b.paragraphSeq}`
                          : `/sutra/${b.sutraSlug}`
                      }
                      className="font-medium text-[var(--jx-accent-cinnabar)] underline-offset-2 hover:underline dark:text-[var(--jx-gold)]"
                    >
                      {b.sutraTitle || b.sutraSlug}
                    </Link>
                  ) : (
                    <span className="font-medium text-[var(--foreground)]">
                      {b.sutraTitle || b.sutraId}
                    </span>
                  )}
                  {b.preview && (
                    <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
                      {b.preview}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBookmark(b.id)}
                  className="shrink-0 self-end sm:self-auto"
                  aria-label={`取消收藏：${b.sutraTitle}`}
                >
                  删除
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </DiscoveryLayout>
  );
}
