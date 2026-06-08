"use client";

/**
 * 抄经字帖配置面板
 * @author 代长亚
 */
import { useMemo } from "react";
import type { ParagraphRow } from "@/lib/sutra/queries";
import {
  COPYBOOK_CHAR_LIMIT,
  extractHanChars,
  mergeParagraphTexts,
  truncateHan,
} from "@/components/copybook/text-utils";
import {
  checkCoverage,
  coveragePercent,
} from "@/components/copybook/char-coverage";
import { suggestFontForTraditional } from "@/components/copybook/font-char-match";
import {
  GRID_LABELS,
  PAPER_PRESETS,
  FONT_LABELS,
  type CopybookDirection,
  type CopybookFontChoice,
  type CopybookRenderConfig,
  type GridType,
  type WriteMode,
} from "@/components/copybook/grid-renderer";
export type CopybookSettings = {
  selectedParagraphIds: Set<string>;
  gridType: GridType;
  mode: WriteMode;
  direction: CopybookDirection;
  fontChoice: CopybookFontChoice;
  paperPresetId: string;
  customCols: number;
  customCellSize: number;
  customMaxRows: number;
  showTraditional: boolean;
};

export function CopybookConfig({
  sutraTitle,
  paragraphs,
  settings,
  onChange,
  processedText,
  charCount,
  truncated,
}: {
  sutraTitle: string;
  paragraphs: ParagraphRow[];
  settings: CopybookSettings;
  onChange: (next: CopybookSettings) => void;
  processedText: string;
  charCount: number;
  truncated: boolean;
}) {
  const isCustom = settings.paperPresetId === "custom";

  function toggleParagraph(id: string) {
    const next = new Set(settings.selectedParagraphIds);
    if (next.has(id)) {
      if (next.size > 1) next.delete(id);
    } else {
      next.add(id);
    }
    onChange({ ...settings, selectedParagraphIds: next });
  }

  function selectAll() {
    onChange({
      ...settings,
      selectedParagraphIds: new Set(paragraphs.map((p) => p.id)),
    });
  }

  return (
    <div
      className="rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] p-4 md:p-6 shadow-sm"
      data-testid="copybook-config"
    >
      <h2 className="mb-4 border-b border-[var(--jx-border)] pb-3 text-base md:text-lg font-semibold">
        抄经设置
      </h2>

      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-[var(--foreground)]">选择段落</label>
          <button
            type="button"
            className="text-xs text-[var(--jx-accent-cinnabar)] dark:text-[var(--jx-gold)] hover:underline"
            onClick={selectAll}
          >
            全选
          </button>
        </div>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-[var(--jx-border)] p-3">
          {paragraphs.map((p) => (
            <label
              key={p.id}
              className="flex cursor-pointer gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
            >
              <input
                type="checkbox"
                checked={settings.selectedParagraphIds.has(p.id)}
                onChange={() => toggleParagraph(p.id)}
                className="mt-1"
              />
              <span className="line-clamp-2">{p.text.slice(0, 80)}{p.text.length > 80 ? "…" : ""}</span>
            </label>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--jx-muted-label)]">
          已选 {charCount} 字
          {truncated && (
            <span className="text-[var(--jx-gold)]">（超出 {COPYBOOK_CHAR_LIMIT} 字上限，已截断）</span>
          )}
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="格子类型">
          <select
            className="w-full rounded-lg border border-[var(--jx-border)] px-3 py-2 text-sm"
            value={settings.gridType}
            onChange={(e) => onChange({ ...settings, gridType: e.target.value as GridType })}
            data-testid="copybook-grid-type"
          >
            {Object.entries(GRID_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </Field>

        <Field label="书写模式">
          <select
            className="w-full rounded-lg border border-[var(--jx-border)] px-3 py-2 text-sm"
            value={settings.mode}
            onChange={(e) => onChange({ ...settings, mode: e.target.value as WriteMode })}
            data-testid="copybook-write-mode"
          >
            <option value="normal">正常（黑字）</option>
            <option value="miaohong">描红（浅红）</option>
            <option value="linmo">临摹（浅灰）</option>
          </select>
        </Field>

        <Field label="字体">
          <select
            className="w-full rounded-lg border border-[var(--jx-border)] px-3 py-2 text-sm"
            value={settings.fontChoice}
            onChange={(e) =>
              onChange({ ...settings, fontChoice: e.target.value as CopybookFontChoice })
            }
          >
            <option value="xuandong">玄冬楷书（6775字）</option>
            <option value="aoyagi">青柳隶书（12204字）</option>
            <option value="qiji">齐伋体（5856字）</option>
          </select>
        </Field>

        {/* 竖排：Phase 2 恢复（单页 canvas 过宽）；默认横排见 defaultCopybookSettings */}
        <Field label="纸张格式">
          <select
            className="w-full rounded-lg border border-[var(--jx-border)] px-3 py-2 text-sm"
            value={settings.paperPresetId}
            onChange={(e) => onChange({ ...settings, paperPresetId: e.target.value })}
          >
            {PAPER_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </Field>

        <Field label="繁体显示">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.showTraditional}
              onChange={(e) => onChange({ ...settings, showTraditional: e.target.checked })}
              data-testid="copybook-traditional"
            />
            转换为繁体（用于抄经）
          </label>
        </Field>
      </div>

      {isCustom && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Field label="列数">
            <input
              type="number"
              min={4}
              max={16}
              className="w-full rounded-lg border border-[var(--jx-border)] px-3 py-2 text-sm"
              value={settings.customCols}
              onChange={(e) =>
                onChange({ ...settings, customCols: Number(e.target.value) || 8 })
              }
            />
          </Field>
          <Field label="行数">
            <input
              type="number"
              min={4}
              max={20}
              className="w-full rounded-lg border border-[var(--jx-border)] px-3 py-2 text-sm"
              value={settings.customMaxRows}
              onChange={(e) =>
                onChange({ ...settings, customMaxRows: Number(e.target.value) || 10 })
              }
            />
          </Field>
          <Field label="格子大小 (px)">
            <input
              type="number"
              min={40}
              max={120}
              className="w-full rounded-lg border border-[var(--jx-border)] px-3 py-2 text-sm"
              value={settings.customCellSize}
              onChange={(e) =>
                onChange({ ...settings, customCellSize: Number(e.target.value) || 70 })
              }
            />
          </Field>
        </div>
      )}

      {/* 覆盖率信息 */}
      {processedText && (() => {
        const cov = checkCoverage(processedText, settings.fontChoice);
        const pct = coveragePercent(cov);
        const fontHint = suggestFontForTraditional(processedText, settings.fontChoice);
        return (
          <div className="mt-4 rounded-lg border border-[var(--jx-border)] bg-[var(--jx-paper-deep)] p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--jx-muted-label)]">
                {FONT_LABELS[settings.fontChoice]} 字库字形覆盖
              </span>
              <span
                className={`font-medium ${
                  pct >= 90 ? "text-green-700 dark:text-green-400" : "text-[var(--jx-gold)] dark:text-[var(--jx-gold)]"
                }`}
              >
                {pct}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--jx-border)]">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  pct >= 90 ? "bg-green-600 dark:bg-green-500" : "bg-[var(--jx-gold)] dark:bg-[rgb(139_37_0/0.06)]0"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-[var(--jx-muted-label)]">
              字库来自碑帖提取；已按简繁对应匹配。未满 100% 多为生僻字，预览会用 Noto 回退显示。
            </p>
            {settings.showTraditional && fontHint && (
              <p className="mt-1 text-xs text-[var(--jx-accent-cinnabar)] dark:text-[var(--jx-gold)]">
                繁体模式下可尝试切换为 {FONT_LABELS[fontHint]}，覆盖率通常更高。
              </p>
            )}
            {cov.missing.length > 0 && cov.missing.length <= 30 && (
              <p className="mt-2 text-xs text-[var(--jx-muted-label)]">
                字库无字形 {cov.missing.length} 字：
                <span className="font-mono">{cov.missing.join(" ")}</span>
              </p>
            )}
            {cov.missing.length > 30 && (
              <p className="mt-2 text-xs text-[var(--jx-muted-label)]">
                字库无字形 {cov.missing.length} 字（超出显示上限）
              </p>
            )}
          </div>
        );
      })()}

      <p className="mt-4 text-xs text-[var(--jx-muted-label)]">
        经名：{sutraTitle} · 预览正文 {processedText.length} 字
      </p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-[var(--jx-muted-label)]">
        {label}
      </label>
      {children}
    </div>
  );
}

/** 根据 settings 与处理后正文构建渲染配置 */
export function buildRenderConfig(
  sutraTitle: string,
  subtitle: string | undefined,
  settings: CopybookSettings,
  text: string,
): CopybookRenderConfig | null {
  const han = extractHanChars(text);
  if (!han) return null;
  const { text: finalText } = truncateHan(han);
  const preset = PAPER_PRESETS.find((p) => p.id === settings.paperPresetId) ?? PAPER_PRESETS[1];
  const cols = settings.paperPresetId === "custom" ? settings.customCols : preset.cols;
  const maxRows =
    settings.paperPresetId === "custom" ? settings.customMaxRows : preset.maxRows;
  const cellSize =
    settings.paperPresetId === "custom" ? settings.customCellSize : preset.cellSize;

  return {
    text: finalText,
    title: sutraTitle,
    subtitle,
    cols,
    cellSize,
    maxRows,
    gridType: settings.gridType,
    mode: settings.mode,
    direction: settings.direction,
    fontChoice: settings.fontChoice,
  };
}

export function useCopybookText(
  paragraphs: ParagraphRow[],
  settings: CopybookSettings,
): { rawMerged: string; processedText: string; charCount: number; truncated: boolean } {
  return useMemo(() => {
    const rawMerged = mergeParagraphTexts(paragraphs, settings.selectedParagraphIds);
    const han = extractHanChars(rawMerged);
    const { text, truncated, originalCount } = truncateHan(han);
    return { rawMerged, processedText: text, charCount: originalCount, truncated };
  }, [paragraphs, settings.selectedParagraphIds]);
}

export function defaultCopybookSettings(paragraphs: ParagraphRow[]): CopybookSettings {
  return {
    selectedParagraphIds: new Set(paragraphs.map((p) => p.id)),
    gridType: "mi",
    mode: "miaohong",
    direction: "horizontal",
    fontChoice: "xuandong",
    paperPresetId: "8x10",
    customCols: 8,
    customCellSize: 70,
    customMaxRows: 10,
    showTraditional: false,
  };
}
