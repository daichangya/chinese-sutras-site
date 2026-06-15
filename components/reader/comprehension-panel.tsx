"use client";

/**
 * 统一理解侧栏：辞典 + AI 解释 + 相似段落
 * @author 代长亚
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, MessageCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AI_DISCLAIMER } from "@/lib/ai/prompts";
import { getDictionarySourceLabel } from "@/lib/dictionaries/sources";
import { entityDescription, parseEntityProperties } from "@/lib/kg/display";
import { personPath } from "@/lib/kg/slug";

type MainTab = "dictionary" | "explain" | "similar";
type ExplainTab = "modern" | "background" | "life";

type DictEntry = {
  id: string;
  source: string;
  headword: string;
  definition: string;
  reading: string | null;
  lang: string;
};

type SimilarItem = {
  paragraphId: string;
  seq: number;
  snippet: string;
};

type TranslatorPerson = {
  id: string;
  slug?: string;
  name_zh: string;
  name_en: string | null;
  properties: string | null;
};

const SHORT_SELECTION_HINT = "请划选两个字以上以获取 AI 现代解释。";

const EXPLAIN_LABELS: Record<ExplainTab, string> = {
  modern: "现代解释",
  background: "背景",
  life: "生活案例",
};

export function ComprehensionPanel({
  selection,
  onSelectionChange,
  sutraTitle,
  sutraSlug,
  paragraphId,
  translatorLabel,
  translatorPerson,
  requestedFetch,
}: {
  selection: string;
  onSelectionChange?: (text: string) => void;
  sutraTitle: string;
  sutraSlug: string;
  paragraphId?: string;
  translatorLabel?: string | null;
  translatorPerson?: TranslatorPerson | null;
  /** 仅右键/侧栏显式操作时触发辞典或 AI 请求 */
  requestedFetch?: { tab: "dictionary" | "explain"; nonce: number } | null;
}) {
  const [mainTab, setMainTab] = useState<MainTab>("explain");
  const [explainTab, setExplainTab] = useState<ExplainTab>("modern");
  const [loading, setLoading] = useState<MainTab | ExplainTab | null>(null);
  const [content, setContent] = useState<Partial<Record<ExplainTab, string>>>({});
  const [dictEntries, setDictEntries] = useState<DictEntry[]>([]);
  const [similarItems, setSimilarItems] = useState<SimilarItem[]>([]);
  const [similarLoading, setSimilarLoading] = useState(false);

  useEffect(() => {
    if (requestedFetch) {
      setMainTab(requestedFetch.tab);
    }
  }, [requestedFetch]);

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

  const fetchExplainTab = useCallback(
    async (tab: ExplainTab, text: string) => {
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
    if (!paragraphId) {
      setSimilarItems([]);
      return;
    }
    let cancelled = false;
    setSimilarLoading(true);
    fetch(`/api/reader/similar?paragraphId=${encodeURIComponent(paragraphId)}`)
      .then((r) => r.json())
      .then((data: { similar?: SimilarItem[] }) => {
        if (!cancelled) setSimilarItems(data.similar ?? []);
      })
      .catch(() => {
        if (!cancelled) setSimilarItems([]);
      })
      .finally(() => {
        if (!cancelled) setSimilarLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paragraphId]);

  useEffect(() => {
    if (!selection) {
      setContent({});
      setDictEntries([]);
      setMainTab("explain");
      setExplainTab("modern");
      return;
    }

    // 划词仅同步选区，不自动请求辞典 / AI（由 Tab 切换或右键菜单触发）
    setContent({});
    setDictEntries([]);
  }, [selection]);

  useEffect(() => {
    if (!selection || !requestedFetch) return;

    if (requestedFetch.tab === "dictionary") {
      void fetchDictionary(selection);
      return;
    }
    setExplainTab("modern");
    void fetchExplainTab("modern", selection);
  }, [selection, requestedFetch, fetchDictionary, fetchExplainTab]);

  function handlePanelMouseUp() {
    const text = window.getSelection()?.toString().trim() ?? "";
    if (text.length >= 1) {
      onSelectionChange?.(text);
    }
  }

  function handleMainTabChange(value: string) {
    const tab = value as MainTab;
    setMainTab(tab);
    if (tab === "dictionary" && selection && dictEntries.length === 0 && loading !== "dictionary") {
      void fetchDictionary(selection);
    }
    if (tab === "explain" && selection && !content[explainTab]) {
      void fetchExplainTab(explainTab, selection);
    }
  }

  function handleExplainTabChange(value: string) {
    const tab = value as ExplainTab;
    setExplainTab(tab);
    if (selection && !content[tab]) {
      void fetchExplainTab(tab, selection);
    }
  }

  if (!selection) {
    return (
      <aside
        data-testid="reader-comprehension-panel"
        className="jx-ai-panel p-4 md:p-5 text-sm text-[var(--muted)] lg:w-auto lg:max-w-none"
        aria-label="理解辅助"
        onMouseUp={handlePanelMouseUp}
      >
        <p className="jx-section-label mb-3">理解</p>
        <div className="flex items-start gap-3 rounded-lg bg-[var(--jx-paper-deep)]/60 px-3 py-3">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--jx-gold)]" aria-hidden="true" />
          <p className="text-xs leading-relaxed">
            划选后仅同步到侧栏「已选」；**不会**自动调用辞典或 AI。请切换「辞典 / 解释」Tab，或使用正文右键菜单。
          </p>
        </div>
        {translatorLabel && (
          <div
            className="mt-4 rounded-md border border-[var(--jx-border)] p-3"
            data-testid="reader-translator-info"
          >
            <p className="text-xs text-[var(--muted)]">译者</p>
            {translatorPerson ? (
              <Link
                href={personPath(translatorPerson.id)}
                className="font-medium text-[var(--jx-accent-cinnabar)] hover:underline dark:text-[var(--jx-gold)]"
              >
                {translatorPerson.name_zh || translatorLabel}
              </Link>
            ) : (
              <p className="font-medium text-[var(--foreground)]">{translatorLabel}</p>
            )}
            {translatorPerson && (
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                {translatorPerson.name_en && (
                  <span className="block">{translatorPerson.name_en}</span>
                )}
                {entityDescription(parseEntityProperties(translatorPerson.properties), 200)}
              </p>
            )}
          </div>
        )}
        {paragraphId && (
          <div className="mt-4">
            <p className="jx-section-label mb-2 text-[10px]">当前段相似</p>
            {similarLoading ? (
              <p className="text-xs text-[var(--muted)]">检索中…</p>
            ) : similarItems.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">暂无相似段落</p>
            ) : (
              <ul className="space-y-1">
                {similarItems.slice(0, 3).map((item) => (
                  <li key={item.paragraphId}>
                    <Link
                      href={`/sutra/${sutraSlug}#p-${item.seq}`}
                      className="block truncate rounded-md px-2 py-1.5 text-xs text-[var(--muted)] hover:bg-[var(--jx-paper-deep)] hover:text-[var(--foreground)]"
                    >
                      {item.snippet || `第 ${item.seq} 段`}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside
      data-testid="reader-comprehension-panel"
      className="jx-ai-panel p-5 lg:sticky lg:top-20"
      aria-label="理解辅助"
      onMouseUp={handlePanelMouseUp}
    >
      <p className="jx-section-label mb-2">已选</p>
      <p
        data-testid="reader-ai-selection"
        className="mb-4 border-l-2 border-[var(--jx-gold)] pl-3 text-sm font-medium leading-relaxed"
      >
        {selection}
      </p>

      <Tabs value={mainTab} onValueChange={handleMainTabChange}>
        <TabsList className="mb-3 w-full flex-wrap bg-[var(--background)] h-auto" aria-label="理解选项">
          <TabsTrigger value="dictionary" className="text-xs">
            辞典
          </TabsTrigger>
          <TabsTrigger value="explain" className="text-xs">
            解释
          </TabsTrigger>
          <TabsTrigger value="similar" className="text-xs">
            相似
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
                <p className="text-xs text-[var(--muted)] mb-1">{getDictionarySourceLabel(e.source)}</p>
                <p className="text-sm whitespace-pre-wrap">{e.definition.slice(0, 500)}</p>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="explain" className="min-h-[4rem]">
          <Tabs value={explainTab} onValueChange={handleExplainTabChange}>
            <TabsList className="mb-2 w-full flex-wrap bg-[var(--jx-paper-deep)] h-auto" aria-label="AI 解释类型">
              {(Object.keys(EXPLAIN_LABELS) as ExplainTab[]).map((tab) => (
                <TabsTrigger key={tab} value={tab} className="text-xs">
                  {EXPLAIN_LABELS[tab]}
                </TabsTrigger>
              ))}
            </TabsList>
            {(Object.keys(EXPLAIN_LABELS) as ExplainTab[]).map((tab) => (
              <TabsContent key={tab} value={tab} className="text-sm leading-relaxed">
                {loading === tab ? (
                  <p className="text-[var(--muted)]">生成中…</p>
                ) : (
                  <p data-testid={tab === "modern" ? "reader-ai-modern" : undefined}>
                    {content[tab] ??
                      (tab === "modern"
                        ? "切换到本标签或使用正文右键「AI 解释」后生成。"
                        : "点击标签加载")}
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
              query: { text: selection, sutraTitle, paragraphId },
            }}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--jx-border)] bg-[rgb(139_37_0/0.06)] px-3 py-2 text-xs font-medium text-[var(--jx-accent-cinnabar)] hover:bg-[rgb(139_37_0/0.1)] transition-colors dark:border-[var(--jx-accent-cinnabar)]/60 dark:bg-[rgb(196_74_42/0.15)] dark:text-[var(--jx-gold)] dark:hover:bg-[#6f1d00]/40"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            与 AI 深入讨论此段
          </Link>
        </TabsContent>

        <TabsContent value="similar" className="min-h-[4rem] text-sm leading-relaxed">
          {similarLoading ? (
            <p className="text-xs text-[var(--muted)]">检索中…</p>
          ) : similarItems.length === 0 ? (
            <p className="text-xs text-[var(--muted)]">暂无相似段落</p>
          ) : (
            <ul className="space-y-2">
              {similarItems.map((item) => (
                <li key={item.paragraphId}>
                  <Link
                    href={`/sutra/${sutraSlug}#p-${item.seq}`}
                    className="block rounded-lg px-2 py-2 text-xs leading-relaxed text-[var(--muted)] hover:bg-[var(--jx-paper-deep)] hover:text-[var(--foreground)]"
                  >
                    {item.snippet || `第 ${item.seq} 段`}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </aside>
  );
}
