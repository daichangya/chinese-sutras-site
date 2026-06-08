/**
 * 经藏浏览页客户端（手风琴部类列表）
 * @author 代长亚
 */
"use client";

import Link from "next/link";
import { useState } from "react";
import { BookOpen, ChevronDown } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { CanonCategoryGroup } from "@/lib/canon/types";

export function CanonBrowser({ groups }: { groups: CanonCategoryGroup[] }) {
  const [open, setOpen] = useState<string | null>(groups[0]?.category ?? null);

  if (groups.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="暂无已导入经目"
        description="运行语料导入后，此处将按部类展示汉传经典。"
      />
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const isOpen = open === group.category;
        return (
          <div
            key={group.category}
            className="overflow-hidden rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)]"
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : group.category)}
              className="sticky top-16 z-10 flex w-full items-center justify-between bg-[var(--jx-paper-elevated)] px-5 py-4 text-left transition-colors hover:bg-[var(--jx-paper-deep)]"
              aria-expanded={isOpen}
            >
              <span>
                <span className="font-medium text-[var(--foreground)]">{group.category}</span>
                <span className="ml-3 text-xs text-[var(--jx-muted-label)]">
                  {group.sutras.length} 部
                </span>
              </span>
              <ChevronDown
                className={`size-4 text-[var(--muted)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                aria-hidden="true"
              />
            </button>
            {isOpen && (
              <ul className="border-t border-[var(--jx-border)] px-3 py-2">
                {group.sutras.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/sutra/${s.slug}`}
                      className="flex items-start justify-between gap-3 rounded-lg px-3 py-3 text-sm transition-colors hover:bg-[var(--jx-paper-deep)]"
                    >
                      <span>
                        <span className="font-medium text-[var(--foreground)]">{s.title}</span>
                        {s.translator && (
                          <span className="mt-0.5 block text-xs text-[var(--muted)]">
                            {s.translator}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-[var(--jx-muted-label)]">
                        {s.cbetaId}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
