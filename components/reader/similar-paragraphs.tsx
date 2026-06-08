/**
 * 相似段落侧栏
 * @author 代长亚
 */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SimilarItem = {
  paragraphId: string;
  seq: number;
  snippet: string;
};

export function SimilarParagraphsPanel({
  sutraSlug,
  paragraphId,
}: {
  sutraSlug: string;
  paragraphId?: string;
}) {
  const [items, setItems] = useState<SimilarItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!paragraphId) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/reader/similar?paragraphId=${encodeURIComponent(paragraphId)}`)
      .then((r) => r.json())
      .then((data: { similar?: SimilarItem[] }) => {
        if (!cancelled) setItems(data.similar ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paragraphId]);

  if (!paragraphId) return null;

  return (
    <div className="mt-6 rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-deep)] p-4 lg:mt-0">
      <p className="jx-section-label mb-3">相似段落</p>
      {loading && <p className="text-xs text-[var(--muted)]">检索中…</p>}
      {!loading && items.length === 0 && (
        <p className="text-xs text-[var(--muted)]">暂无相似段落</p>
      )}
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.paragraphId}>
            <Link
              href={`/sutra/${sutraSlug}#p-${item.seq}`}
              className="block rounded-lg px-2 py-2 text-xs leading-relaxed text-[var(--muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)]"
            >
              {item.snippet || `第 ${item.seq} 段`}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
