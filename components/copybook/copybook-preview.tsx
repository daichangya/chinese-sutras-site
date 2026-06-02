"use client";

/**
 * 抄经字帖 Canvas 预览与导出
 * @author jingxin
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import {
  renderCopybookCanvas,
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { ready: fontReady } = useCopybookFont(config?.fontChoice ?? "xuandong");
  const [hasPreview, setHasPreview] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const generate = useCallback(() => {
    if (!config?.text || !canvasRef.current) return;
    const canvas = renderCopybookCanvas(config);
    canvasRef.current.width = canvas.width;
    canvasRef.current.height = canvas.height;
    const ctx = canvasRef.current.getContext("2d");
    if (ctx) {
      ctx.drawImage(canvas, 0, 0);
    }
    setDataUrl(canvas.toDataURL("image/png"));
    setHasPreview(true);
  }, [config]);

  useEffect(() => {
    if (autoGenerate && fontReady && config?.text) {
      generate();
    }
  }, [autoGenerate, fontReady, config, generate]);

  function downloadPng() {
    if (!dataUrl || !config) return;
    const a = document.createElement("a");
    a.download = `${config.title}.png`;
    a.href = dataUrl;
    a.click();
  }

  function downloadPdf() {
    if (!dataUrl || !config || !canvasRef.current) return;
    const pdf = new jsPDF({
      orientation: canvasRef.current.width > canvasRef.current.height ? "landscape" : "portrait",
      unit: "px",
      format: [canvasRef.current.width, canvasRef.current.height],
    });
    pdf.addImage(dataUrl, "PNG", 0, 0, canvasRef.current.width, canvasRef.current.height);
    pdf.save(`${config.title}.pdf`);
  }

  return (
    <div className="rounded-xl border border-[var(--jx-border)] bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--jx-border)] pb-4">
        <h2 className="text-lg font-semibold text-[var(--foreground)]">字帖预览</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            data-testid="copybook-generate"
            onClick={generate}
            disabled={!config?.text || !fontReady}
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
            下载 PNG
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
        className="min-h-[240px] overflow-x-auto py-4 text-center"
        data-testid="copybook-preview-container"
      >
        {!config?.text ? (
          <p className="py-16 text-[var(--muted)]">请选择段落并配置字帖选项</p>
        ) : !fontReady ? (
          <p className="py-16 text-[var(--muted)]">书法字体加载中…</p>
        ) : !hasPreview ? (
          <p className="py-16 text-[var(--muted)]">点击「生成预览」查看字帖</p>
        ) : (
          <canvas
            ref={canvasRef}
            className="mx-auto max-w-full rounded border border-[var(--jx-border)]"
            data-testid="copybook-canvas"
          />
        )}
      </div>
    </div>
  );
}
