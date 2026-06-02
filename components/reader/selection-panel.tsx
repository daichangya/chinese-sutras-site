"use client";

import { useCallback, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AI_DISCLAIMER } from "@/lib/ai/prompts";

type TabKey = "modern" | "background" | "life";

/**
 * 划选 AI 侧栏（大藏经 AI 式工具面板）
 * @author jingxin
 */
export function SelectionPanel({
  sutraTitle,
  paragraphId,
}: {
  sutraTitle: string;
  paragraphId?: string;
}) {
  const [selection, setSelection] = useState("");
  const [loading, setLoading] = useState<TabKey | null>(null);
  const [content, setContent] = useState<Partial<Record<TabKey, string>>>({});

  const fetchTab = useCallback(
    async (tab: TabKey, text: string) => {
      if (content[tab]) return;
      setLoading(tab);
      try {
        const res = await fetch("/api/ai/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selection: text, tab, paragraphId, sutraTitle }),
        });
        const data = (await res.json()) as { content?: string };
        setContent((c) => ({ ...c, [tab]: data.content ?? "暂时无法生成解释。" }));
      } catch {
        setContent((c) => ({ ...c, [tab]: "网络错误，请稍后再试。" }));
      } finally {
        setLoading(null);
      }
    },
    [content, paragraphId, sutraTitle],
  );

  function onMouseUp() {
    const text = window.getSelection()?.toString().trim() ?? "";
    if (text.length >= 2) {
      setSelection(text);
      setContent({});
    }
  }

  if (!selection) {
    return (
      <aside
        data-testid="reader-ai-panel"
        className="jx-ai-panel p-5 text-sm text-[var(--muted)]"
        onMouseUp={onMouseUp}
      >
        <p className="jx-section-label mb-2">AI 辅助</p>
        在经文中划选一句，即可查看现代解释、背景与生活案例。
      </aside>
    );
  }

  return (
    <aside
      data-testid="reader-ai-panel"
      className="jx-ai-panel p-5 lg:sticky lg:top-20"
      onMouseUp={onMouseUp}
    >
      <p className="jx-section-label mb-2">已选文句</p>
      <p className="mb-4 border-l-2 border-amber-600 pl-3 text-sm font-medium leading-relaxed">
        {selection}
      </p>
      <Tabs
        defaultValue="modern"
        onValueChange={(v) => {
          const tab = v as TabKey;
          void fetchTab(tab, selection);
        }}
      >
        <TabsList className="mb-2 w-full bg-[var(--background)]">
          <TabsTrigger value="modern" className="flex-1 text-xs">
            现代解释
          </TabsTrigger>
          <TabsTrigger value="background" className="flex-1 text-xs">
            背景
          </TabsTrigger>
          <TabsTrigger value="life" className="flex-1 text-xs">
            生活案例
          </TabsTrigger>
        </TabsList>
        {(["modern", "background", "life"] as TabKey[]).map((tab) => (
          <TabsContent key={tab} value={tab} className="min-h-[4rem] text-sm leading-relaxed">
            {loading === tab ? (
              <p className="text-[var(--muted)]">生成中…</p>
            ) : (
              <p>{content[tab] ?? "加载中…"}</p>
            )}
          </TabsContent>
        ))}
      </Tabs>
      <p className="mt-4 rounded-md border border-amber-200/60 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100">
        {AI_DISCLAIMER}
      </p>
    </aside>
  );
}
