"use client";

/**
 * 阅读器正文右键/长按菜单
 * @author 代长亚
 */
import { useCallback, useRef, type ReactNode } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  getReaderTextSelection,
  READER_CONTENT_ID,
} from "@/lib/reader/reader-selection";
import {
  resolveContextParagraphId,
  resolveContextText,
} from "@/lib/reader/context-actions";
import type { ParagraphRow } from "@/lib/sutra/queries";

const LONG_PRESS_MS = 500;

export type ReaderContextAction =
  | "share"
  | "copy"
  | "dictionary"
  | "explain"
  | "speech";

export function ReaderContextMenu({
  children,
  paragraphs,
  activeParagraphId,
  onShare,
  onCopy,
  onDictionary,
  onExplain,
  onSpeechFromParagraph,
}: {
  children: ReactNode;
  paragraphs: ParagraphRow[];
  activeParagraphId?: string;
  onShare: (paragraphId: string) => void;
  onCopy: (text: string) => void;
  onDictionary: (text: string, paragraphId?: string) => void;
  onExplain: (text: string, paragraphId?: string) => void;
  onSpeechFromParagraph: (paragraphId: string) => void;
}) {
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressPoint = useRef<{ x: number; y: number } | null>(null);
  const menuTargetRef = useRef<HTMLElement | null>(null);

  const getActiveParagraph = useCallback(() => {
    return (
      paragraphs.find((p) => p.id === activeParagraphId) ?? paragraphs[0] ?? null
    );
  }, [paragraphs, activeParagraphId]);

  const resolveActionContext = useCallback(() => {
    const selection = getReaderTextSelection();
    const paragraph = selection?.paragraphId
      ? paragraphs.find((p) => p.id === selection.paragraphId)
      : getActiveParagraph();
    const paragraphId = resolveContextParagraphId(
      selection?.paragraphId,
      paragraph?.id,
    );
    const text = resolveContextText(selection?.text ?? "", paragraph?.text);
    return { text, paragraphId, paragraph };
  }, [paragraphs, getActiveParagraph]);

  function runAction(action: ReaderContextAction) {
    const { text, paragraphId, paragraph } = resolveActionContext();
    if (!paragraphId && !paragraph) return;

    const pid = paragraphId ?? paragraph!.id;

    switch (action) {
      case "share":
        onShare(pid);
        break;
      case "copy":
        if (text) onCopy(text);
        break;
      case "dictionary":
        onDictionary(text, pid);
        break;
      case "explain":
        onExplain(text, pid);
        break;
      case "speech":
        onSpeechFromParagraph(pid);
        break;
    }
  }

  /** 等菜单关闭后再执行，避免与 Dialog 焦点抢占导致后续右键失效 */
  function scheduleAction(action: ReaderContextAction) {
    const ctx = resolveActionContext();
    if (!ctx.paragraphId && !ctx.paragraph) return;
    window.setTimeout(() => runAction(action), 0);
  }

  function restoreReaderFocus() {
    document.getElementById(READER_CONTENT_ID)?.focus({ preventScroll: true });
  }

  function clearLongPress() {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressPoint.current = null;
    menuTargetRef.current = null;
  }

  function openContextMenuAtPoint() {
    const target = menuTargetRef.current;
    const point = longPressPoint.current;
    if (!target || !point) return;
    target.dispatchEvent(
      new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        clientX: point.x,
        clientY: point.y,
        view: window,
      }),
    );
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger
        asChild
        onPointerDown={(event) => {
          // 鼠标拖选文字不触发长按；仅触屏长按弹出菜单
          if (event.pointerType !== "touch") return;
          if (longPressTimer.current) clearTimeout(longPressTimer.current);
          menuTargetRef.current = event.currentTarget as HTMLElement;
          longPressPoint.current = { x: event.clientX, y: event.clientY };
          longPressTimer.current = setTimeout(() => {
            openContextMenuAtPoint();
            clearLongPress();
          }, LONG_PRESS_MS);
        }}
        onPointerUp={clearLongPress}
        onPointerCancel={clearLongPress}
        onPointerMove={(event) => {
          if (!longPressPoint.current) return;
          const dx = Math.abs(event.clientX - longPressPoint.current.x);
          const dy = Math.abs(event.clientY - longPressPoint.current.y);
          if (dx > 8 || dy > 8) clearLongPress();
        }}
      >
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent
        data-testid="reader-context-menu"
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          restoreReaderFocus();
        }}
      >
        <ContextMenuItem
          data-testid="reader-context-share"
          onSelect={() => scheduleAction("share")}
        >
          分享此段
        </ContextMenuItem>
        <ContextMenuItem
          data-testid="reader-context-copy"
          onSelect={() => scheduleAction("copy")}
        >
          复制
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          data-testid="reader-context-dictionary"
          onSelect={() => scheduleAction("dictionary")}
        >
          查辞典
        </ContextMenuItem>
        <ContextMenuItem
          data-testid="reader-context-explain"
          onSelect={() => scheduleAction("explain")}
        >
          AI 解释
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          data-testid="reader-context-speech"
          onSelect={() => scheduleAction("speech")}
        >
          从本段朗读
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
