/**
 * 单条聊天消息组件（支持 Markdown 渲染）
 * @author 代长亚
 */
"use client";

import { useMemo } from "react";
import { marked } from "marked";
import { Bot, User } from "lucide-react";
import Link from "next/link";
import { AI_DISCLAIMER } from "@/lib/ai/prompts";
import type { ChatMessage } from "@/lib/chat/types";

interface ChatMessageProps {
  message: ChatMessage;
  isLast: boolean;
}

export function ChatMessageItem({ message, isLast }: ChatMessageProps) {
  const renderedContent = useMemo(() => {
    if (message.role !== "assistant") return null;
    return marked.parse(message.content || "…", { async: false }) as string;
  }, [message.content, message.role]);

  if (message.role === "user") {
    return (
      <div className="chat-message-row chat-message-row--user">
        <span className="chat-message-avatar chat-message-avatar--user" aria-hidden="true">
          <User className="size-4" />
        </span>
        <div className="chat-bubble-user">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-message-row">
      <span className="chat-message-avatar chat-message-avatar--assistant" aria-hidden="true">
        <Bot className="size-4" />
      </span>
      <div className="chat-bubble-assistant">
        <div className="chat-markdown text-[var(--foreground)]">
          {message.content ? (
            <div dangerouslySetInnerHTML={{ __html: renderedContent ?? message.content }} />
          ) : (
            <span className="text-[var(--muted)]">正在生成…</span>
          )}
        </div>
        {message.citations && message.citations.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-xs font-medium text-[var(--jx-muted-label)]">经文引用</p>
            <ul className="flex flex-wrap gap-2">
              {message.citations.map((c, i) => (
                <li key={c.paragraphId}>
                  <Link
                    href={`/sutra/${c.sutraSlug}#p-${c.seq}`}
                    className="chat-citation-pill"
                    data-testid="chat-citation-chip"
                  >
                    <span className="font-medium text-[var(--jx-accent-cinnabar)]">
                      [{i + 1}] {c.sutraTitle}
                      {c.seq ? ` · 第 ${c.seq} 段` : ""}
                    </span>
                    <span className="mt-1 line-clamp-2 text-[var(--muted)]">{c.snippet}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {isLast && message.content && (
          <p className="mt-3 text-xs text-[var(--muted)] opacity-70">{AI_DISCLAIMER}</p>
        )}
      </div>
    </div>
  );
}
