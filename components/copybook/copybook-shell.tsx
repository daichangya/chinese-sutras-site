"use client";

/**
 * 抄经页客户端壳层
 * @author 代长亚
 */
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ParagraphRow, SutraRow } from "@/lib/sutra/queries";
import {
  buildRenderConfig,
  CopybookConfig,
  defaultCopybookSettings,
  useCopybookText,
  type CopybookSettings,
} from "@/components/copybook/copybook-config";
import { CopybookPreview } from "@/components/copybook/copybook-preview";
import { s2tText } from "@/components/copybook/text-utils";

export function CopybookShell({
  sutra,
  paragraphs,
  currentChapter,
  chapters,
}: {
  sutra: SutraRow;
  paragraphs: ParagraphRow[];
  currentChapter: number;
  chapters: number[];
}) {
  const [settings, setSettings] = useState<CopybookSettings>(() =>
    defaultCopybookSettings(paragraphs),
  );
  const [displayText, setDisplayText] = useState("");
  const { processedText, charCount, truncated } = useCopybookText(paragraphs, settings);

  useEffect(() => {
    setSettings((prev) => ({
      ...defaultCopybookSettings(paragraphs),
      gridType: prev.gridType,
      mode: prev.mode,
      direction: prev.direction,
      fontChoice: prev.fontChoice,
      paperPresetId: prev.paperPresetId,
      showTraditional: prev.showTraditional,
    }));
  }, [paragraphs]);

  useEffect(() => {
    let cancelled = false;
    async function convert() {
      if (settings.showTraditional && processedText) {
        const converted = await s2tText(processedText);
        if (!cancelled) setDisplayText(converted);
      } else {
        setDisplayText(processedText);
      }
    }
    convert();
    return () => {
      cancelled = true;
    };
  }, [processedText, settings.showTraditional]);

  const subtitle =
    chapters.length > 1 ? `第 ${currentChapter} 卷` : sutra.translator ?? undefined;

  const renderConfig = useMemo(
    () => buildRenderConfig(sutra.title, subtitle, settings, displayText),
    [sutra.title, subtitle, settings, displayText],
  );

  return (
    <div className="jx-reader mx-auto px-3 md:px-4 py-6 md:py-8">
      <header className="mb-6 md:mb-8 border-b border-[var(--jx-border)] pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3 md:gap-4">
          <div>
            <p className="mb-1 text-xs tracking-wider text-[var(--jx-muted-label)]">抄经字帖</p>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">{sutra.title}</h1>
            {sutra.translator && (
              <p className="mt-1 text-sm text-[var(--muted)]">{sutra.translator}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <Link
              href={`/sutra/${sutra.slug}${chapters.length > 1 ? `?chapter=${currentChapter}` : ""}`}
              className="rounded-full border border-[var(--jx-border)] px-4 py-1.5 text-[var(--jx-muted-label)] hover:text-[var(--foreground)]"
            >
              返回阅读
            </Link>
          </div>
        </div>
        {chapters.length > 1 && (
          <nav className="mt-4 flex flex-wrap gap-2">
            {chapters.map((seq) => (
              <Link
                key={seq}
                href={`/sutra/${sutra.slug}/copybook?chapter=${seq}`}
                className={`rounded-full px-3 py-1 text-xs ${
                  seq === currentChapter
                    ? "bg-[var(--jx-accent-cinnabar)] text-white dark:bg-[var(--jx-accent-cinnabar)]"
                    : "border border-[var(--jx-border)] text-[var(--muted)]"
                }`}
              >
                第 {seq} 卷
              </Link>
            ))}
          </nav>
        )}
      </header>

      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6 lg:gap-8">
        <CopybookConfig
          sutraTitle={sutra.title}
          paragraphs={paragraphs}
          settings={settings}
          onChange={setSettings}
          processedText={displayText}
          charCount={charCount}
          truncated={truncated}
        />
        <CopybookPreview config={renderConfig} />
      </div>
    </div>
  );
}
