"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle } from "lucide-react";
import { AI_DISCLAIMER } from "@/lib/ai/prompts";
import { entityDescription, parseEntityProperties } from "@/lib/kg/display";

type TabKey = "dictionary" | "modern" | "background" | "life";

type DictEntry = {
  id: string;
  source: string;
  headword: string;
  definition: string;
  reading: string | null;
  lang: string;
};

type PersonCard = {
  id: string;
  name_zh: string;
  name_en: string | null;
  properties: string | null;
};

const SHORT_SELECTION_HINT = "请划选两个字以上以获取 AI 现代解释。";

/**
 * 划选查词 + AI 侧栏（selection 由 ReaderShell 控制）
 * @author 代长亚
 */
export function SelectionPanel({
  selection,
  onSelectionChange,
  sutraTitle,
  paragraphId,
  cbetaId,
  translatorLabel,
}: {
  selection: string;
  onSelectionChange?: (text: string) => void;
  sutraTitle: string;
  paragraphId?: string;
  cbetaId?: string;
  translatorLabel?: string | null;
}) {
  const [activeTab, setActiveTab] = useState<TabKey>("modern");
  const [loading, setLoading] = useState<TabKey | null>(null);
  const [content, setContent] = useState<Partial<Record<TabKey, string>>>({});
  const [dictEntries, setDictEntries] = useState<DictEntry[]>([]);
  const [translatorPerson, setTranslatorPerson] = useState<PersonCard | null>(null);

  useEffect(() => {
    if (!cbetaId) return;
    let cancelled = false;
    fetch(`/api/kg/person?cbeta_id=${encodeURIComponent(cbetaId)}`)
      .then((r) => r.json())
      .then((data: { person?: PersonCard | null }) => {
        if (!cancelled) setTranslatorPerson(data.person ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [cbetaId]);

  const fetchDictionary = useCallback(async (text: string) => {
    setLoading("dictionary");
    try {
      const res = await fetch(
        `/api/dictionary/lookup/grouped?q=${encodeURIComponent(text)}&size=3`,
      );
      const data = (await res.json()) as {
        groups?: Array<{ entries: DictEntry[] }>;
      };
      const flat = (data.groups ?? []).flatMap((g) => g.entries).slice(0, 6);
      setDictEntries(flat);
    } catch {
      setDictEntries([]);
    } finally {
      setLoading((prev) => (prev === "dictionary" ? null : prev));
    }
  }, []);

  const fetchAiTab = useCallback(
    async (tab: Exclude<TabKey, "dictionary">, text: string) => {
      if (text.length < 2) {
        if (tab === "modern") {
          setContent((c) => ({ ...c, modern: SHORT_SELECTION_HINT }));
        }
        return;
      }
      setLoading(tab);
      try {
        const res = await fetch("/api/ai/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selection: text, tab, paragraphId, sutraTitle }),
        });
        const data = (await res.json()) as { content?: string; error?: string };
        const message =
          data.content ??
          (res.ok ? "暂时无法生成解释。" : data.error ?? "暂时无法生成解释。");
        setContent((c) => ({ ...c, [tab]: message }));
      } catch {
        setContent((c) => ({ ...c, [tab]: "网络错误，请稍后再试。" }));
      } finally {
        setLoading((prev) => (prev === tab ? null : prev));
      }
    },
    [paragraphId, sutraTitle],
  );

  useEffect(() => {
    if (!selection) {
      setContent({});
      setDictEntries([]);
      setActiveTab("modern");
      return;
    }

    setContent({});
    setDictEntries([]);
    setActiveTab("modern");
    void fetchDictionary(selection);
    void fetchAiTab("modern", selection);
  }, [selection, paragraphId, fetchDictionary, fetchAiTab]);

  function handlePanelMouseUp() {
    const text = window.getSelection()?.toString().trim() ?? "";
    if (text.length >= 1) {
      onSelectionChange?.(text);
    }
  }

  function handleTabChange(value: string) {
    const tab = value as TabKey;
    setActiveTab(tab);
    if (tab === "dictionary") {
      if (dictEntries.length === 0 && loading !== "dictionary") {
        void fetchDictionary(selection);
      }
      return;
    }
    if (!content[tab]) {
      void fetchAiTab(tab, selection);
    }
  }

  if (!selection) {
    return (
      <aside
        data-testid="reader-ai-panel"
        className="jx-ai-panel p-4 md:p-5 text-sm text-[var(--muted)] lg:w-auto lg:max-w-none"
        aria-label="AI 辅助理解"
        onMouseUp={handlePanelMouseUp}
      >
        <p className="jx-section-label mb-2">查词与 AI</p>
        在经文中划选字词，可查佛学辞典；或划选一句查看 AI 解释。
        {translatorLabel && (
          <div className="mt-4 rounded-md border border-[var(--jx-border)] p-3">
            <p className="text-xs text-[var(--muted)]">译者</p>
            <p className="font-medium text-[var(--foreground)]">{translatorLabel}</p>
            {translatorPerson && (
              <p className="mt-1 text-xs leading-relaxed">
                {translatorPerson.name_en && <span className="block">{translatorPerson.name_en}</span>}
                {entityDescription(parseEntityProperties(translatorPerson.properties), 200)}
              </p>
            )}
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside
      data-testid="reader-ai-panel"
      className="jx-ai-panel p-5 lg:sticky lg:top-20"
      onMouseUp={handlePanelMouseUp}
    >
      <p className="jx-section-label mb-2">已选</p>
      <p
        data-testid="reader-ai-selection"
        className="mb-4 border-l-2 border-[var(--jx-gold)] pl-3 text-sm font-medium leading-relaxed"
      >
        {selection}
      </p>
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="mb-2 w-full flex-wrap bg-[var(--background)] h-auto" aria-label="AI 解释选项">
          <TabsTrigger value="dictionary" className="text-xs">
            辞典
          </TabsTrigger>
          <TabsTrigger value="modern" className="text-xs">
            现代解释
          </TabsTrigger>
          <TabsTrigger value="background" className="text-xs">
            背景
          </TabsTrigger>
          <TabsTrigger value="life" className="text-xs">
            生活案例
          </TabsTrigger>
        </TabsList>
        <TabsContent value="dictionary" className="min-h-[4rem] text-sm leading-relaxed space-y-3">
          {loading === "dictionary" ? (
            <p className="text-[var(--muted)]">查询辞典…</p>
          ) : dictEntries.length === 0 ? (
            <p className="text-[var(--muted)]">未找到辞典条目，可尝试多选几字或查看 AI 解释。</p>
          ) : (
            dictEntries.map((e) => (
              <div key={e.id} className="border-b border-[var(--jx-border)] pb-2 last:border-0">
                <p className="font-medium">
                  {e.headword}
                  {e.reading && <span className="ml-2 text-xs text-[var(--muted)]">{e.reading}</span>}
                </p>
                <p className="text-xs text-[var(--muted)] mb-1">{e.source}</p>
                <p className="text-sm whitespace-pre-wrap">{e.definition.slice(0, 500)}</p>
              </div>
            ))
          )}
        </TabsContent>
        {(["modern", "background", "life"] as const).map((tab) => (
          <TabsContent key={tab} value={tab} className="min-h-[4rem] text-sm leading-relaxed">
            {loading === tab ? (
              <p className="text-[var(--muted)]">生成中…</p>
            ) : (
              <p data-testid={tab === "modern" ? "reader-ai-modern" : undefined}>
                {content[tab] ?? (tab === "modern" ? "加载中…" : "点击标签加载")}
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>
      <p className="mt-4 rounded-md border border-[var(--jx-border)]/60 bg-[rgb(139_37_0/0.06)] px-3 py-2 text-xs leading-relaxed text-[var(--jx-ink-classical)] dark:border-[var(--jx-border)]/50 dark:bg-[rgb(196_74_42/0.15)] dark:text-[var(--jx-gold)]">
        {AI_DISCLAIMER}
      </p>
      <Link
        href={{
          pathname: "/chat",
          query: {
            text: selection,
            sutraTitle,
            paragraphId,
          },
        }}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--jx-border)] bg-[rgb(139_37_0/0.06)] px-3 py-2 text-xs font-medium text-[var(--jx-accent-cinnabar)] hover:bg-[rgb(139_37_0/0.1)] transition-colors dark:border-[var(--jx-accent-cinnabar)]/60 dark:bg-[rgb(196_74_42/0.15)] dark:text-[var(--jx-gold)] dark:hover:bg-[#6f1d00]/40"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        与 AI 深入讨论此段
      </Link>
    </aside>
  );
}
