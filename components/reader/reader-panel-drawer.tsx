/**
 * 阅读器侧栏抽屉（xl 以下）
 * @author 代长亚
 */
"use client";

import { X } from "lucide-react";
import type { ReaderPanel } from "@/components/reader/reader-toolbar";

const PANEL_TITLES: Record<Exclude<ReaderPanel, null>, string> = {
  toc: "目录",
  comprehension: "理解",
};

export function ReaderPanelDrawer({
  panel,
  onClose,
  children,
}: {
  panel: ReaderPanel;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!panel) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label={PANEL_TITLES[panel]}>
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="关闭侧栏"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 flex h-full w-[min(100%,22rem)] flex-col border-l border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] shadow-xl animate-in slide-in-from-right">
        <div className="flex items-center justify-between border-b border-[var(--jx-border)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--jx-ink-classical)]">{PANEL_TITLES[panel]}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-[var(--muted)] hover:bg-[var(--jx-paper-deep)]"
            aria-label="关闭"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
