"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Share, Link, Image, X, Check } from "lucide-react";
import { brandShareAttribution } from "@/lib/brand";

interface ShareParagraph {
  id: string;
  seq: number;
  text: string;
  sutraTitle: string;
  sutraSlug: string;
  cbetaId: string;
}

export function ShareDialog({
  paragraph,
  open,
  onOpenChange,
}: {
  paragraph: ShareParagraph | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [shareCode, setShareCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateShare() {
    if (!paragraph) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sutraSlug: paragraph.sutraSlug,
          paragraphId: paragraph.id,
          paragraphSeq: paragraph.seq,
          text: paragraph.text.slice(0, 500),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "创建分享失败");
      setShareCode(data.shareCode);
      setShareUrl(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "未知错误");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyLink() {
    if (!shareUrl) return;
    const url = `${window.location.origin}${shareUrl}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCopyText() {
    if (!paragraph) return;
    const text = `${paragraph.text}\n\n—— ${paragraph.sutraTitle}（${paragraph.cbetaId}）\n${brandShareAttribution()}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setShareCode(null);
    setShareUrl(null);
    setCopied(false);
    setError(null);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[var(--jx-paper)] border-[var(--jx-border)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[var(--foreground)]">
            <Share className="w-4 h-4" aria-hidden="true" />
            分享此段
          </DialogTitle>
          <DialogDescription className="text-[var(--muted)]">
            {paragraph?.text.slice(0, 60)}...
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-4 py-2">
            <Button
              onClick={handleCreateShare}
              disabled={loading}
              className="w-full bg-[var(--jx-accent-cinnabar)] text-white hover:bg-[var(--jx-accent-cinnabar-hover)]"
            >
              {loading ? "生成中..." : "创建分享链接"}
            </Button>
            {error && (
              <p className="text-center text-sm text-[var(--jx-error)]">{error}</p>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* 分享链接 */}
            <div className="p-3 rounded-lg bg-[var(--jx-paper-deep)] border border-[var(--jx-border)]">
              <p className="text-xs text-[var(--muted)] mb-1">分享链接</p>
              <div className="flex items-center gap-2">
                <code className="text-xs flex-1 truncate text-[var(--foreground)]">
                  {shareUrl}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyLink}
                  className="text-xs shrink-0"
                  aria-label={copied ? "已复制链接" : "复制链接"}
                >
                  {copied ? <Check className="w-3 h-3" aria-hidden="true" /> : <Link className="w-3 h-3" aria-hidden="true" />}
                  {copied ? "已复制" : "复制"}
                </Button>
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={handleCopyText}
                className="flex flex-col items-center gap-1 h-auto py-4"
                aria-label="复制文字"
              >
                <Link className="w-5 h-5" aria-hidden="true" />
                <span className="text-xs">复制文字</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (shareUrl) window.open(shareUrl, "_blank");
                }}
                className="flex flex-col items-center gap-1 h-auto py-4"
                aria-label="预览卡片"
              >
                <Image className="w-5 h-5" aria-hidden="true" />
                <span className="text-xs">预览卡片</span>
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-[var(--muted)]"
          >
            <X className="w-3 h-3 mr-1" />
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
