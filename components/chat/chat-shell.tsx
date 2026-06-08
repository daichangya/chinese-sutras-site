/**
 * Chat 页壳层 — 无边框 inset 布局
 * @author 代长亚
 */
"use client";

import { useEffect, useState } from "react";
import { ChatHistory } from "@/components/chat/chat-history";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatList } from "@/components/chat/chat-list";
import { ChatStaleConfigBanner } from "@/components/chat/chat-stale-config-banner";
import type { ChatConversation } from "@/lib/chat/types";
import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface ChatShellProps {
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  activeId: string | null;
  isStreaming: boolean;
  onSelectConversation: (id: string) => void;
  onCreateNew: () => void;
  onDeleteConversation: (id: string) => void;
  onClearAll: () => void;
  onSend: (text: string) => void;
  onStop: () => void;
}

export function ChatShell({
  conversations,
  activeConversation,
  activeId,
  isStreaming,
  onSelectConversation,
  onCreateNew,
  onDeleteConversation,
  onClearAll,
  onSend,
  onStop,
}: ChatShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setSidebarOpen(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const historyProps = {
    conversations,
    activeId,
    onCreateNew,
    onDelete: onDeleteConversation,
    onClearAll,
  };

  return (
    <div className="jx-chat-viewport">
      {/* 桌面侧栏 */}
      {sidebarOpen && (
        <aside
          className="jx-chat-sidebar transition-[width,opacity] duration-200 overflow-hidden"
          style={{ width: "var(--jx-sidebar-width)" }}
        >
          <ChatHistory {...historyProps} onSelect={onSelectConversation} />
        </aside>
      )}

      {/* 移动端抽屉 */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div
            className="chat-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          <div className="chat-sidebar-drawer">
            <ChatHistory
              {...historyProps}
              onSelect={(id) => {
                onSelectConversation(id);
                setSidebarOpen(false);
              }}
              onCreateNew={() => {
                onCreateNew();
                setSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* 主对话区 */}
      <main className="jx-chat-main">
        <header className="jx-chat-header">
          <div className="flex min-w-0 items-center gap-2 md:gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((v) => !v)}
              className="flex cursor-pointer items-center justify-center rounded-md p-1.5 text-[var(--muted)] transition-colors hover:bg-[var(--jx-paper-deep)] hover:text-[var(--foreground)]"
              aria-label={sidebarOpen ? "收起对话列表" : "展开对话列表"}
              aria-expanded={sidebarOpen}
            >
              <Menu className="size-4 lg:hidden" aria-hidden="true" />
              {sidebarOpen ? (
                <PanelLeftClose className="hidden size-4 lg:block" aria-hidden="true" />
              ) : (
                <PanelLeftOpen className="hidden size-4 lg:block" aria-hidden="true" />
              )}
            </button>
            <div className="min-w-0">
              <h1 className="text-base font-medium text-[var(--jx-ink-classical)]">AI 问经</h1>
              {activeConversation?.title && activeConversation.title !== "新对话" && (
                <p className="truncate text-xs text-[var(--muted)]">{activeConversation.title}</p>
              )}
            </div>
          </div>
          {activeConversation?.context?.sutraTitle && (
            <span className="jx-chat-context-badge">{activeConversation.context.sutraTitle}</span>
          )}
        </header>

        <ChatStaleConfigBanner
          messages={activeConversation?.messages ?? []}
          onCreateNew={onCreateNew}
        />

        <ChatList
          messages={activeConversation?.messages ?? []}
          isStreaming={isStreaming}
          onSuggestQuestion={onSend}
        />

        <ChatInput
          onSend={onSend}
          onStop={onStop}
          isStreaming={isStreaming}
          placeholder="问我任何关于佛法的问题…"
        />
      </main>
    </div>
  );
}
