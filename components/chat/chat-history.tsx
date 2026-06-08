/**
 * 对话历史侧栏
 * @author 代长亚
 */
"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { groupSessionsByDate } from "@/lib/chat/group-sessions";
import type { ChatConversation } from "@/lib/chat/types";
import { Bot, MessageSquare, Plus, Trash2 } from "lucide-react";

interface ChatHistoryProps {
  conversations: ChatConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export function ChatHistory({
  conversations,
  activeId,
  onSelect,
  onCreateNew,
  onDelete,
  onClearAll,
}: ChatHistoryProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const grouped = useMemo(() => groupSessionsByDate(conversations), [conversations]);

  return (
    <div className="flex h-full flex-col">
      {/* 品牌区 */}
      <div className="px-4 pb-4 pt-4">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--jx-accent-cinnabar)]/8 text-[var(--jx-accent-cinnabar)]">
            <Bot className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-[var(--jx-ink-classical)]">AI 问经</p>
            <p className="jx-section-label mt-0.5">对话记录</p>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCreateNew}
          className="h-8 w-full cursor-pointer gap-1.5 rounded-lg bg-[rgb(139_37_0/0.06)] text-xs text-[var(--jx-accent-cinnabar)] hover:bg-[rgb(139_37_0/0.1)]"
          aria-label="新建对话"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          新对话
        </Button>
      </div>

      {/* 对话列表 */}
      <div className="flex-1 overflow-y-auto py-2">
        {conversations.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-[var(--muted)]">
            <MessageSquare className="mx-auto mb-3 size-8 opacity-30" aria-hidden="true" />
            <p>还没有对话记录</p>
            <p className="mt-1 text-xs">点击上方「新对话」开始</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="px-4 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--jx-muted-label)]">
                {group.label}
              </p>
              <ul>
                {group.items.map((c) => (
                  <li
                    key={c.id}
                    className={`mx-2 my-0.5 rounded-lg transition-colors ${
                      c.id === activeId
                        ? "bg-[rgb(139_37_0/0.08)] dark:bg-[rgb(196_74_42/0.15)]"
                        : "hover:bg-[var(--jx-paper)]/80"
                    }`}
                    onMouseEnter={() => setHoveredId(c.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <div className="flex items-center gap-1 pr-1">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelect(c.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onSelect(c.id);
                          }
                        }}
                        className="flex min-h-[44px] flex-1 cursor-pointer items-center gap-2 px-3 py-2.5 text-left text-sm"
                      >
                        <MessageSquare className="size-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
                        <span className="flex-1 truncate text-[var(--foreground)]">{c.title}</span>
                      </div>
                      {hoveredId === c.id && (
                        <button
                          type="button"
                          onClick={() => onDelete(c.id)}
                          className="shrink-0 cursor-pointer rounded p-1.5 text-[var(--muted)] transition-colors hover:text-[var(--jx-error)]"
                          aria-label={`删除对话：${c.title}`}
                        >
                          <Trash2 className="size-3.5" aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>

      {conversations.length > 0 && (
        <div className="p-3 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 w-full cursor-pointer text-xs text-[var(--muted)] transition-colors hover:text-[var(--jx-error)]"
          >
            <Trash2 className="mr-1.5 size-3.5" aria-hidden="true" />
            清空所有对话
          </Button>
        </div>
      )}
    </div>
  );
}
