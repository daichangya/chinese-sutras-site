"use client";

/**
 * 抄经字帖 Canvas 预览与导出
 * @author 代长亚
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import {
  A4_PAGE,
  renderCopybookPages,
  type CopybookRenderConfig,
} from "@/components/copybook/grid-renderer";
import { useCopybookFont } from "@/components/copybook/use-copybook-font";

export function CopybookPreview({
  config,
  autoGenerate = true,
}: {
  config: CopybookRenderConfig | null;
  autoGenerate?: boolean;
}) {
  const renderedPagesRef = useRef<HTMLCanvasElement[]>([]);
  const fontChoice = config?.fontChoice ?? "xuandong";
  const { ready: fontReady, failed: fontFailed } = useCopybookFont(fontChoice);
  const [hasPreview, setHasPreview] = useState(false);
  const [pageCount, setPageCount] = useState(0);
  const [pageUrls, setPageUrls] = useState<string[]>([]);

  const generate = useCallback(() => {
    if (!config?.text) return;
    const pages = renderCopybookPages(config);
    renderedPagesRef.current = pages;
    setPageUrls(pages.map((canvas) => canvas.toDataURL("image/png")));
    setPageCount(pages.length);
    setHasPreview(true);
  }, [config]);

  useEffect(() => {
    if (autoGenerate && fontReady && config?.text) {
      generate();
    }
  }, [autoGenerate, fontReady, config, generate]);

  function downloadPng() {
    if (!config || pageUrls.length === 0) return;
    pageUrls.forEach((url, index) => {
      const a = document.createElement("a");
      const suffix =
        pageUrls.length > 1
          ? `-第${String(index + 1).padStart(2, "0")}页`
          : "";
      a.download = `${config.title}${suffix}.png`;
      a.href = url;
      a.click();
    });
  }

  function downloadPdf() {
    const pages = renderedPagesRef.current;
    if (!config || pages.length === 0) return;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    pages.forEach((canvas, index) => {
      if (index > 0) pdf.addPage("a4", "portrait");
      const imgData = canvas.toDataURL("image/png");
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        A4_PAGE.widthMm,
        A4_PAGE.heightMm,
      );
    });

    pdf.save(`${config.title}.pdf`);
  }

  const canGenerate = Boolean(config?.text) && fontReady;

  return (
    <div className="rounded-xl border border-[var(--jx-border)] bg-[var(--jx-paper-elevated)] p-4 md:p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--jx-border)] pb-4">
        <div>
          <h2 className="text-base md:text-lg font-semibold text-[var(--foreground)]">字帖预览</h2>
          {hasPreview && pageCount > 0 && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              共 {pageCount} 页 · A4 竖版导出
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            data-testid="copybook-generate"
            onClick={generate}
            disabled={!canGenerate}
          >
            生成预览
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="copybook-download-png"
            onClick={downloadPng}
            disabled={!hasPreview}
          >
            下载 PNG{pageCount > 1 ? `（${pageCount} 张）` : ""}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-testid="copybook-download-pdf"
            onClick={downloadPdf}
            disabled={!hasPreview}
          >
            下载 PDF
          </Button>
        </div>
      </div>
      <div
        className="min-h-[240px] max-h-[70vh] overflow-y-auto py-4"
        data-testid="copybook-preview-container"
      >
        {!config?.text ? (
          <p className="py-16 text-center text-[var(--muted)]">
            请选择段落并配置字帖选项
          </p>
        ) : !fontReady ? (
          <p className="py-16 text-center text-[var(--muted)]">书法字体加载中…</p>
        ) : !hasPreview ? (
          <p className="py-16 text-center text-[var(--muted)]">
            点击「生成预览」查看字帖
          </p>
        ) : null}
        {fontFailed && fontReady && (
          <p className="mb-3 text-center text-xs text-[var(--jx-gold)]">
            书法字体加载失败，缺失字将显示为占位符。
          </p>
        )}
        {hasPreview && pageUrls.length > 0 && (
          <div className="mx-auto flex max-w-[420px] flex-col gap-6">
            {pageUrls.map((url, index) => (
              <figure key={url} className="text-center">
                {pageCount > 1 && (
                  <figcaption className="mb-2 text-xs text-[var(--muted)]">
                    第 {index + 1} / {pageCount} 页
                  </figcaption>
                )}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`${config?.title ?? "字帖"} 第 ${index + 1} 页`}
                  className="mx-auto w-full rounded border border-[var(--jx-border)] shadow-sm"
                  style={{ aspectRatio: `${A4_PAGE.widthPx} / ${A4_PAGE.heightPx}` }}
                  data-testid={index === 0 ? "copybook-canvas" : undefined}
                />
              </figure>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
