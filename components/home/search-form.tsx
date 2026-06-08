/**
 * 经文搜索表单（无尽藏 / FoJin combo 搜索条）
 * @author 代长亚
 */
"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Search } from "lucide-react";

function readQueryFromForm(form: HTMLFormElement): string {
  const raw = new FormData(form).get("q");
  return typeof raw === "string" ? raw.trim() : "";
}

export function SearchForm({
  defaultQuery = "",
  variant = "default",
}: {
  defaultQuery?: string;
  variant?: "default" | "combo";
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultQuery);

  useEffect(() => {
    setQ(defaultQuery);
  }, [defaultQuery]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = readQueryFromForm(e.currentTarget);
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    router.refresh();
  }

  const formProps = {
    onSubmit,
    action: "/search",
    method: "get" as const,
  };

  if (variant === "combo") {
    return (
      <form {...formProps} className="jx-combo-search mx-auto w-full">
        <input
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索经文、辞典、人物…"
          className="jx-input"
          data-testid="search-input"
          aria-label="搜索经文"
        />
        <button type="submit" className="jx-combo-search-btn gap-1.5" aria-label="搜索">
          <Search className="size-4" aria-hidden="true" />
          搜索
        </button>
      </form>
    );
  }

  return (
    <form {...formProps} className="flex w-full max-w-2xl flex-col sm:flex-row gap-2">
      <input
        type="search"
        name="q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="搜索经文：空、慈悲、因果…"
        className="jx-input w-full"
        data-testid="search-input"
        aria-label="搜索经文"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-lg bg-[var(--jx-accent-cinnabar)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#6f1d00] sm:w-auto w-full jx-ui-shell"
      >
        搜索
      </button>
    </form>
  );
}
