/**
 * 消息列表（滚动 + 空态 + 流式指示）
 * @author 代长亚
 */
"use client";

import { useEffect, useRef } from "react";
import { Bot } from "lucide-react";
import { ChatMessageItem } from "./chat-message";
import type { ChatMessage } from "@/lib/chat/types";

export const HOT_QUESTIONS = [
  { category: "白话翻译", question: "什么是四圣谛？" },
  { category: "经文解读", question: "如何理解「色即是空」？" },
  { category: "对比辨析", question: "菩萨戒与声闻戒有何区别？" },
  { category: "佛教史话", question: "净土法门的基本义理是什么？" },
  { category: "经文解读", question: "禅宗「明心见性」指什么？" },
  { category: "对比辨析", question: "十二因缘的次第是什么？" },
] as const;

interface ChatListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSuggestQuestion?: (question: string) => void;
}

export function ChatList({ messages, isStreaming, onSuggestQuestion }: ChatListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, messages[messages.length - 1]?.content]);

  if (messages.length === 0) {
    return (
      <div
        className="flex flex-1 items-center justify-center overflow-y-auto px-4 py-8"
        data-testid="chat-empty-state"
      >
        <div className="w-full max-w-xl text-center">
          <div className="chat-empty-glow">
            <Bot className="size-8 text-[var(--jx-accent-cinnabar)]" aria-hidden="true" />
          </div>
          <p className="jx-section-label mb-2">智能问答</p>
          <h2 className="text-lg font-medium text-[var(--jx-ink-classical)]">向 AI 问经</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            你可以询问任何关于佛法义理、经文释义、修行方法的问题，
            也可以就日常生活中的困惑寻求佛法角度的启发。
          </p>
          {onSuggestQuestion && (
            <div className="mt-8 grid gap-2 sm:grid-cols-2">
              {HOT_QUESTIONS.map((item) => (
                <button
                  key={item.question}
                  type="button"
                  onClick={() => onSuggestQuestion(item.question)}
                  className="chat-hot-card"
                  data-testid="chat-hot-question"
                >
                  <span className="chat-hot-card-category">{item.category}</span>
                  <span className="text-[var(--foreground)]">{item.question}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        {messages.map((msg, i) => (
          <ChatMessageItem
            key={msg.id}
            message={msg}
            isLast={i === messages.length - 1}
          />
        ))}
        {isStreaming && (
          <div className="chat-thinking py-2" aria-live="polite">
            <span>AI 正在思考</span>
            <span className="chat-thinking-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
