"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Share, Copy, Check, Download } from "lucide-react";
import { ShareCardExport } from "@/components/reader/share-card-export";
import { exportShareCardImage } from "@/lib/share/export-share-image";
import { brandShareAttribution, brandShareFilename } from "@/lib/brand";

interface ShareCardProps {
  excerpt: string;
  sutraTitle: string;
  cbetaId: string;
  sutraSlug: string;
  paragraphSeq: number;
  shareCode: string;
  viewCount?: number;
  baseUrl?: string;
}

/**
 * 分享落地页：竖版海报预览 + 复制/下载/系统分享
 * @author 代长亚
 */
export function ShareCard({
  excerpt,
  sutraTitle,
  cbetaId,
  sutraSlug,
  paragraphSeq,
  shareCode,
  viewCount = 0,
  baseUrl,
}: ShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [previewScale, setPreviewScale] = useState(0.5);

  const origin = baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "");
  const shareUrl = `${origin}/share/${shareCode}`;
  const source = `${sutraTitle}（${cbetaId}）第 ${paragraphSeq} 段`;

  useEffect(() => {
    function updateScale() {
      const maxWidth = Math.min(window.innerWidth - 32, 540);
      setPreviewScale(Math.min(1, maxWidth / 1080));
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  async function handleCopyText() {
    const text = `${excerpt}\n\n—— ${source}\n${brandShareAttribution()}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleDownloadImage() {
    setDownloading(true);
    try {
      await exportShareCardImage(brandShareFilename(shareCode));
    } finally {
      setDownloading(false);
    }
  }

  function handleNativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator
        .share({
          title: sutraTitle,
          text: `${excerpt}\n\n—— ${source}`,
          url: shareUrl,
        })
        .catch(() => {});
    }
  }

  return (
    <div className="min-h-screen bg-[var(--jx-paper)]">
      <header className="sticky top-0 z-10 border-b border-[var(--jx-border)] bg-[var(--jx-paper-elevated)]">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link
            href={`/sutra/${sutraSlug}`}
            className="text-sm text-[var(--jx-accent)] hover:underline"
          >
            ← 返回原文
          </Link>
          <span className="text-xs text-[var(--jx-muted-label)]">已浏览 {viewCount} 次</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <ShareCardExport
          excerpt={excerpt}
          sutraTitle={sutraTitle}
          cbetaId={cbetaId}
          paragraphSeq={paragraphSeq}
          shareUrl={shareUrl}
          previewScale={previewScale}
        />

        <div className="mt-6 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleCopyText}
              variant="outline"
              className="flex h-auto flex-col items-center gap-1 border-[var(--jx-border)] py-4 hover:bg-[var(--jx-paper-deep)]"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
              <span className="text-xs">{copied ? "已复制" : "复制文字"}</span>
            </Button>
            <Button
              onClick={handleDownloadImage}
              variant="outline"
              disabled={downloading}
              className="flex h-auto flex-col items-center gap-1 border-[var(--jx-border)] py-4 hover:bg-[var(--jx-paper-deep)]"
            >
              <Download className="h-5 w-5" />
              <span className="text-xs">{downloading ? "生成中..." : "下载图片"}</span>
            </Button>
          </div>

          {typeof navigator !== "undefined" && "share" in navigator && (
            <Button
              onClick={handleNativeShare}
              className="w-full bg-[var(--jx-accent-cinnabar)] text-white hover:bg-[#6f1d00]"
            >
              <Share className="mr-2 h-4 w-4" />
              分享到...
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
