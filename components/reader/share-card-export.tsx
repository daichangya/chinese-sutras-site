"use client";

/**
 * 分享卡片导出用竖版 4:5 海报（预览 = 导出源）
 * @author 代长亚
 */
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getBrandName, getBrandSlug, brandInlineLabel } from "@/lib/brand";
import {
  computeShareExcerptFontSize,
  SHARE_CARD_BACKGROUND,
  SHARE_CARD_COLORS,
  SHARE_CARD_EXPORT_ID,
  SHARE_CARD_HEIGHT,
  SHARE_CARD_PADDING,
  SHARE_CARD_QR_SIZE,
  SHARE_CARD_QUOTE_MIN_HEIGHT,
  SHARE_CARD_TITLE_FONT_SIZE,
  SHARE_CARD_WIDTH,
} from "@/lib/share/share-card-tokens";

export interface ShareCardExportProps {
  excerpt: string;
  sutraTitle: string;
  cbetaId: string;
  paragraphSeq: number;
  shareUrl?: string;
  /** 预览缩放（仅影响外层展示，不影响导出像素） */
  previewScale?: number;
}

function CornerOrnament() {
  return (
    <div
      className="pointer-events-none absolute right-0 top-0 opacity-[0.06]"
      style={{ width: 160, height: 160 }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" fill="currentColor" className="h-full w-full text-[#8b2500]">
        <path
          d="M20,20 L80,20 L80,80 L20,80 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M30,30 L70,30 L70,70 L30,70 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  );
}

export function ShareCardExport({
  excerpt,
  sutraTitle,
  cbetaId,
  paragraphSeq,
  shareUrl,
  previewScale = 1,
}: ShareCardExportProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const excerptFontSize = computeShareExcerptFontSize(Array.from(excerpt).length);
  const source = `${sutraTitle}（${cbetaId}）第 ${paragraphSeq} 段`;

  useEffect(() => {
    if (!shareUrl) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(shareUrl, {
      width: SHARE_CARD_QR_SIZE * 2,
      margin: 1,
      color: {
        dark: SHARE_CARD_COLORS.ink,
        light: SHARE_CARD_COLORS.paperElevated,
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [shareUrl]);

  const card = (
    <div
      id={SHARE_CARD_EXPORT_ID}
      data-testid="share-card-export"
      className="relative box-border flex flex-col overflow-hidden"
      style={{
        width: SHARE_CARD_WIDTH,
        height: SHARE_CARD_HEIGHT,
        padding: SHARE_CARD_PADDING,
        background: SHARE_CARD_BACKGROUND,
        border: `1px solid ${SHARE_CARD_COLORS.borderGold}`,
        borderRadius: 16,
        fontFamily: '"Noto Sans SC", system-ui, sans-serif',
      }}
    >
      <CornerOrnament />

      {/* 品牌行 */}
      <div
        className="flex items-center gap-2"
        style={{ marginBottom: 32, color: SHARE_CARD_COLORS.mutedLabel, fontSize: 14 }}
      >
        <span
          className="inline-block rounded-full"
          style={{
            width: 6,
            height: 6,
            backgroundColor: SHARE_CARD_COLORS.cinnabar,
            opacity: 0.7,
          }}
        />
        <span style={{ letterSpacing: "0.12em" }}>{brandInlineLabel()}</span>
      </div>

      {/* 标题区 */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontFamily: '"Noto Serif SC", "Songti SC", serif',
            fontSize: SHARE_CARD_TITLE_FONT_SIZE,
            fontWeight: 600,
            lineHeight: 1.35,
            color: SHARE_CARD_COLORS.ink,
          }}
        >
          {sutraTitle}
        </h1>
        <p
          style={{
            margin: "12px 0 0",
            fontSize: 18,
            color: SHARE_CARD_COLORS.muted,
          }}
        >
          {cbetaId} · 第 {paragraphSeq} 段
        </p>
      </div>

      <div
        style={{
          height: 1,
          backgroundColor: SHARE_CARD_COLORS.border,
          marginBottom: 32,
        }}
      />

      {/* 引文区 */}
      <div
        className="flex flex-1 flex-col justify-center"
        style={{ minHeight: SHARE_CARD_QUOTE_MIN_HEIGHT, marginBottom: 32 }}
      >
        <blockquote
          className="relative"
          style={{
            margin: 0,
            paddingLeft: 20,
            borderLeft: `3px solid ${SHARE_CARD_COLORS.cinnabar}`,
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: 24,
              top: -8,
              fontSize: 56,
              lineHeight: 1,
              fontFamily: '"Noto Serif SC", serif',
              color: SHARE_CARD_COLORS.cinnabar,
              opacity: 0.15,
            }}
          >
            "
          </span>
          <p
            className="whitespace-pre-wrap break-words"
            style={{
              margin: 0,
              fontFamily: '"Noto Serif SC", "Songti SC", serif',
              fontSize: excerptFontSize,
              fontWeight: 500,
              lineHeight: 1.75,
              letterSpacing: "0.04em",
              color: SHARE_CARD_COLORS.inkClassical,
            }}
          >
            {excerpt}
          </p>
        </blockquote>

        <p
          style={{
            marginTop: 28,
            fontSize: 16,
            fontStyle: "italic",
            color: SHARE_CARD_COLORS.muted,
          }}
        >
          <span style={{ color: SHARE_CARD_COLORS.borderGold, marginRight: 8 }}>—</span>
          {source}
        </p>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between"
        style={{
          paddingTop: 24,
          borderTop: `1px solid ${SHARE_CARD_COLORS.border}`,
        }}
      >
        <div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 500,
              color: SHARE_CARD_COLORS.cinnabar,
              letterSpacing: "0.08em",
            }}
          >
            {getBrandSlug()}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: SHARE_CARD_COLORS.mutedLabel,
            }}
          >
            来自{getBrandName()}经典阅读
          </p>
        </div>

        {shareUrl && qrDataUrl && (
          <div className="flex items-center gap-3">
            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: SHARE_CARD_COLORS.mutedLabel,
                textAlign: "right",
                lineHeight: 1.5,
              }}
            >
              扫码
              <br />
              阅读原文
            </p>
            <img
              src={qrDataUrl}
              alt="分享链接二维码"
              width={SHARE_CARD_QR_SIZE}
              height={SHARE_CARD_QR_SIZE}
              style={{ display: "block", borderRadius: 4 }}
            />
          </div>
        )}
      </div>
    </div>
  );

  if (previewScale >= 0.999) {
    return card;
  }

  const scaledHeight = SHARE_CARD_HEIGHT * previewScale;
  const scaledWidth = SHARE_CARD_WIDTH * previewScale;

  return (
    <div
      className="mx-auto overflow-hidden"
      style={{ width: scaledWidth, height: scaledHeight }}
    >
      <div
        style={{
          transform: `scale(${previewScale})`,
          transformOrigin: "top left",
          width: SHARE_CARD_WIDTH,
          height: SHARE_CARD_HEIGHT,
        }}
      >
        {card}
      </div>
    </div>
  );
}
