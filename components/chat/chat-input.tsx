/**
 * 聊天输入组件
 * @author 代长亚
 */
"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Send, Square } from "lucide-react";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
}

const MAX_ROWS = 6;
const LINE_HEIGHT = 24;

export function ChatInput({
  onSend,
  onStop,
  disabled = false,
  isStreaming = false,
  placeholder = "问我任何关于佛法的问题…",
}: ChatInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = LINE_HEIGHT * MAX_ROWS;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [text, adjustHeight]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="jx-chat-dock">
      <div className="mx-auto max-w-3xl">
        <div className="chat-input-shell">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={disabled || isStreaming}
            aria-label="输入消息"
            className="text-sm leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted)] disabled:opacity-50"
          />
          <div className="chat-input-toolbar">
            <span className="text-[11px] text-[var(--muted)]">
              Enter 发送 · Shift+Enter 换行
            </span>
            <span className="chat-input-toolbar-spacer" />
            {isStreaming ? (
              <Button
                size="sm"
                variant="ghost"
                type="button"
                onClick={onStop}
                className="h-9 cursor-pointer rounded-lg px-3 text-xs text-[var(--jx-error)] hover:bg-[var(--jx-error-bg)] hover:text-[var(--jx-error)]"
                aria-label="停止生成"
              >
                <Square className="mr-1 size-3.5" aria-hidden="true" />
                停止
              </Button>
            ) : (
              <Button
                size="sm"
                type="button"
                onClick={handleSend}
                disabled={disabled || !text.trim()}
                className="h-9 cursor-pointer rounded-lg px-3 text-xs bg-[var(--jx-accent-cinnabar)] hover:bg-[var(--jx-accent-cinnabar-hover)] text-white disabled:opacity-40"
                aria-label="发送消息"
              >
                <Send className="mr-1 size-3.5" aria-hidden="true" />
                发送
              </Button>
            )}
          </div>
        </div>
        <p className="mt-2 text-center text-xs text-[var(--muted)] opacity-80">
          AI 生成内容仅供参考，不代表权威佛法开示
        </p>
      </div>
    </div>
  );
}
