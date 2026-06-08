"use client";

import { forwardRef, useEffect, useState } from "react";
import { Lock, LockOpen, BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { GaijiText } from "@/components/reader/gaiji-text";
import { PinyinRubyText } from "@/components/reader/pinyin-ruby-text";
import { VersionSelector, getAvailableVersions } from "@/components/parallel/version-selector";
import { useSyncScroll } from "@/lib/parallel/use-sync-scroll";
import { Button } from "@/components/ui/button";
import type { ParagraphRow, SutraRow } from "@/lib/sutra/queries";

/** 简体 -> 繁体 */
async function s2tText(text: string): Promise<string> {
  const res = await fetch("/api/convert/s2t", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: text.slice(0, 2000) }),
  });
  if (!res.ok) return text;
  const data = await res.json();
  return data.text ?? text;
}

type PanelProps = {
  sutra: SutraRow;
  paragraphs: ParagraphRow[];
  version: string;
  showPinyin: boolean;
};

/**
 * 单侧经文面板 - 复用阅读器核心渲染逻辑
 */
const ParallelPanel = forwardRef<HTMLDivElement, PanelProps>(
  function ParallelPanel({ sutra, paragraphs, version, showPinyin }, ref) {
    const [showTraditional, setShowTraditional] = useState(false);
    const [traditionalTexts, setTraditionalTexts] = useState<Record<string, string>>({});

    useEffect(() => {
      setShowTraditional(localStorage.getItem("jx-traditional") === "1");
    }, []);

    // 按需转换繁体
    useEffect(() => {
      if (!showTraditional) return;
      let cancelled = false;
      const convert = async () => {
        const result: Record<string, string> = {};
        for (const p of paragraphs.slice(0, 50)) {
          if (!traditionalTexts[p.id]) {
            result[p.id] = await s2tText(p.text);
          }
        }
        if (!cancelled && Object.keys(result).length > 0) {
          setTraditionalTexts((prev) => ({ ...prev, ...result }));
        }
      };
      convert();
      return () => {
        cancelled = true;
      };
    }, [showTraditional, paragraphs]);

    const getDisplayText = (p: ParagraphRow): string => {
      let raw = p.text;
      if (version === "vernacular" && p.colloquial) {
        raw = p.colloquial;
      }
      if (showTraditional) return traditionalTexts[p.id] ?? raw;
      return raw;
    };

    const versionLabel =
      version === "original" ? "底本" : version === "commentary" ? "注疏" : "白话";

    return (
      <div ref={ref} className="h-full overflow-y-auto">
        <div className="sticky top-0 z-10 border-b border-[var(--jx-border)] bg-[var(--background)]/95 backdrop-blur-sm px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm md:text-base font-semibold text-[var(--foreground)]">
                {sutra.title}
              </h2>
              <p className="text-xs text-[var(--muted)] mt-0.5">
                {sutra.cbetaId} · {versionLabel}
                {sutra.translator ? ` · ${sutra.translator}` : ""}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              type="button"
              className={`text-xs rounded-full ${showTraditional ? "bg-[var(--jx-accent-cinnabar)] text-white hover:bg-[#6f1d00] border-[var(--jx-accent-cinnabar)]" : ""}`}
              onClick={() => {
                setShowTraditional((v) => !v);
                localStorage.setItem("jx-traditional", !showTraditional ? "1" : "0");
              }}
            >
              {showTraditional ? "简体" : "繁体"}
            </Button>
          </div>
        </div>
        <article className="prose-jx reader-body px-4 py-6">
          {paragraphs.map((p, idx) => (
            <p
              key={`panel-${version}-${p.id}`}
              id={`p-${p.seq}`}
              className={`group relative ${idx === 0 ? "animate-jx-fade" : ""}`}
              style={idx === 0 ? { animationDelay: "100ms" } : {}}
            >
              {showPinyin ? (
                <PinyinRubyText text={getDisplayText(p)} />
              ) : (
                <GaijiText text={getDisplayText(p)} />
              )}
            </p>
          ))}
        </article>
      </div>
    );
  },
);

/**
 * 平行阅读客户端组件
 */
export function ParallelReader({
  sutra,
  paragraphs,
}: {
  sutra: SutraRow;
  paragraphs: ParagraphRow[];
}) {
  const availableVersions = getAvailableVersions(paragraphs);
  const defaultRight = availableVersions.includes("vernacular") ? "vernacular" : "original";
  const [leftVersion, setLeftVersion] = useState("original");
  const [rightVersion, setRightVersion] = useState(defaultRight);
  const [showPinyin, setShowPinyin] = useState(false);
  const { leftRef, rightRef, isLocked, toggleLock } = useSyncScroll(true);

  useEffect(() => {
    setShowPinyin(localStorage.getItem("jx-pinyin") === "1");
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-5rem)]">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 border-b border-[var(--jx-border)] bg-[var(--background)] px-4 py-2">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/sutra/${sutra.slug}`}
              className="text-[var(--jx-muted-label)] hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
            <BookOpen className="size-4 text-[var(--jx-muted-label)]" aria-hidden="true" />
            <span className="text-sm font-medium text-[var(--foreground)]">平行阅读</span>
          </div>
          <div className="flex items-center gap-3">
            <VersionSelector
              selected={leftVersion}
              onChange={setLeftVersion}
              available={availableVersions}
            />
            <span className="text-xs text-[var(--jx-muted-label)] hidden md:inline">对比</span>
            <VersionSelector
              selected={rightVersion}
              onChange={setRightVersion}
              available={availableVersions}
            />
            <Button
              variant="outline"
              size="sm"
              type="button"
              className={`text-xs rounded-full gap-1.5 ${
                isLocked
                  ? "bg-[var(--jx-accent-cinnabar)] text-white hover:bg-[#6f1d00] border-[var(--jx-accent-cinnabar)]"
                  : ""
              }`}
              onClick={toggleLock}
              title={isLocked ? "解锁同步滚动" : "锁定同步滚动"}
            >
              {isLocked ? (
                <Lock className="size-3.5" aria-hidden="true" />
              ) : (
                <LockOpen className="size-3.5" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">{isLocked ? "已同步" : "未同步"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 双栏内容区 */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--jx-border)] overflow-hidden">
        <ParallelPanel
          ref={leftRef}
          sutra={sutra}
          paragraphs={paragraphs}
          version={leftVersion}
          showPinyin={showPinyin}
        />
        <ParallelPanel
          ref={rightRef}
          sutra={sutra}
          paragraphs={paragraphs}
          version={rightVersion}
          showPinyin={showPinyin}
        />
      </div>
    </div>
  );
}
