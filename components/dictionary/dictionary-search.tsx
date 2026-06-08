/**
 * 字典搜索框（带防抖查询 + 搜索历史）
 * @author 代长亚
 */
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Search, Clock } from "lucide-react";

const STORAGE_KEY = "jingxin:dict-history";
const MAX_HISTORY = 10;

function getHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

function saveHistory(query: string) {
  if (typeof window === "undefined") return;
  try {
    const history = getHistory();
    const updated = [query, ...history.filter((h) => h !== query)].slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }
}

function clearHistory() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function DictionarySearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [q, setQ] = useState(initialQ);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  useEffect(() => {
    if (!showHistory) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showHistory]);

  const doSearch = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      saveHistory(trimmed);
      setHistory(getHistory());
      router.push(`/dictionary?q=${encodeURIComponent(trimmed)}`);
      setShowHistory(false);
    },
    [router],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    doSearch(q);
  };

  const handleClearHistory = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl">
      <form onSubmit={onSubmit} className="flex w-full flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[var(--jx-muted-label)] pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => {
              if (history.length > 0) setShowHistory(true);
            }}
            placeholder="输入佛学词汇：菩提、般若、涅槃…"
            className="jx-input jx-input-with-icon w-full"
            data-testid="dict-search-input"
            aria-label="搜索字典"
            aria-expanded={showHistory}
            aria-haspopup="listbox"
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-lg bg-[var(--jx-accent-cinnabar)]/80 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6f1d00] dark:bg-[var(--jx-accent-cinnabar)]/70 dark:hover:bg-[#6f1d00] sm:w-auto w-full"
          data-testid="dict-search-btn"
        >
          查字典
        </button>
      </form>

      {/* 搜索历史下拉 */}
      {showHistory && history.length > 0 && (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] shadow-jx" role="listbox" aria-label="搜索历史">
          <div className="flex items-center justify-between px-3 pt-2 pb-1">
            <span className="flex items-center gap-1 text-xs text-[var(--jx-muted-label)]">
              <Clock className="size-3" aria-hidden="true" />
              搜索历史
            </span>
            <button
              type="button"
              onClick={handleClearHistory}
              className="text-xs text-[var(--jx-muted-label)] hover:text-[var(--foreground)] transition-colors"
              aria-label="清除搜索历史"
            >
              清除
            </button>
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {history.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onClick={() => doSearch(item)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--jx-paper-deep)] transition-colors text-left"
                  aria-label={`搜索 ${item}`}
                >
                  <Clock className="size-3.5 text-[var(--jx-muted-label)] shrink-0" aria-hidden="true" />
                  <span className="truncate">{item}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
