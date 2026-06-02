/**
 * 经文搜索表单（无尽藏式轻量搜索）
 * @author jingxin
 */
"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SearchForm({ defaultQuery = "" }: { defaultQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed) router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-xl gap-2">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索经文：空、慈悲、因果…"
        className="jx-input"
        data-testid="search-input"
        aria-label="搜索经文"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-lg bg-amber-800/80 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-900 dark:bg-amber-700/70 dark:hover:bg-amber-600"
      >
        搜索
      </button>
    </form>
  );
}
