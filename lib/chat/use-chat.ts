/**
 * AI 对话状态管理 Hook
 * 管理对话列表、消息列表、流式响应、localStorage 持久化
 * @author 代长亚
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChatConversation, ChatMessage, ChatCitation } from "@/lib/chat/types";

const STORAGE_KEY = "jingxin-chat-conversations";
const ACTIVE_KEY = "jingxin-chat-active-id";

function loadConversations(): ChatConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: ChatConversation[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

function loadActiveId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}

function saveActiveId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(ACTIVE_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_KEY);
  }
}

function generateId() {
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function useChat() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const convos = loadConversations();
    setConversations(convos);
    const savedId = loadActiveId();
    if (savedId && convos.find((c) => c.id === savedId)) {
      setActiveId(savedId);
    } else if (convos.length > 0) {
      setActiveId(convos[0].id);
    }
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;

  const updateConversations = useCallback((updater: (prev: ChatConversation[]) => ChatConversation[]) => {
    setConversations((prev) => {
      const next = updater(prev);
      saveConversations(next);
      return next;
    });
  }, []);

  /** 新建对话 */
  const createConversation = useCallback(
    (context?: ChatConversation["context"]) => {
      const id = generateId();
      const convo: ChatConversation = {
        id,
        title: context?.sutraTitle ? `关于「${context.sutraTitle}」的讨论` : "新的对话",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        context,
      };
      updateConversations((prev) => [convo, ...prev]);
      setActiveId(id);
      saveActiveId(id);
      return id;
    },
    [updateConversations],
  );

  /** 删除单条对话 */
  const deleteConversation = useCallback(
    (id: string) => {
      updateConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        const remaining = conversations.filter((c) => c.id !== id);
        const nextId = remaining[0]?.id ?? null;
        setActiveId(nextId);
        saveActiveId(nextId);
      }
    },
    [activeId, conversations, updateConversations],
  );

  /** 清空所有对话 */
  const clearAll = useCallback(() => {
    updateConversations(() => []);
    setActiveId(null);
    saveActiveId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_KEY);
    }
  }, [updateConversations]);

  /** 重命名对话 */
  const renameConversation = useCallback(
    (id: string, title: string) => {
      updateConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title, updatedAt: Date.now() } : c)),
      );
    },
    [updateConversations],
  );

  /** 切换活跃对话 */
  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
    saveActiveId(id);
  }, []);

  /** 发送消息并获取流式响应 */
  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming) return;

      let convId = activeId;
      if (!convId) {
        convId = createConversation();
      }

      const userMsg: ChatMessage = {
        id: generateId(),
        role: "user",
        content,
        timestamp: Date.now(),
      };

      // Add user message
      updateConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const messages = [...c.messages, userMsg];
          // Auto-title from first message
          const title = c.messages.length === 0 ? content.slice(0, 30) + (content.length > 30 ? "…" : "") : c.title;
          return { ...c, messages, title, updatedAt: Date.now() };
        }),
      );

      // Create placeholder for assistant response
      const assistantId = generateId();
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      updateConversations((prev) =>
        prev.map((c) =>
          c.id === convId
            ? { ...c, messages: [...c.messages, assistantMsg], updatedAt: Date.now() }
            : c,
        ),
      );

      setIsStreaming(true);
      const abortController = new AbortController();
      abortRef.current = abortController;

      try {
        const conversation = conversations.find((c) => c.id === convId);
        const messagesToSend = conversation
          ? [...conversation.messages, userMsg].map((m) => ({ role: m.role, content: m.content }))
          : [{ role: "user" as const, content }];

        const context = conversation?.context;

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: messagesToSend, context }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          throw new Error(`API error ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) {
          throw new Error("Response body is not readable");
        }

        const decoder = new TextDecoder();
        let fullContent = "";
        let citations: ChatCitation[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const parsed = JSON.parse(line.slice(6)) as {
                  delta: string;
                  done: boolean;
                  citations?: ChatCitation[];
                };
                if (parsed.delta) {
                  fullContent += parsed.delta;
                }
                if (parsed.citations) {
                  citations = parsed.citations;
                }
                if (parsed.done) {
                  break;
                }
              } catch {
                // Skip malformed SSE lines (upstream gateway chunks)
              }
            }
          }

          updateConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantId ? { ...m, content: fullContent, citations } : m,
                ),
                updatedAt: Date.now(),
              };
            }),
          );
        }

        updateConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantId ? { ...m, content: fullContent, citations } : m,
              ),
              updatedAt: Date.now(),
            };
          }),
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;

        // Set error message
        const errorMsg = err instanceof Error ? err.message : "网络错误，请稍后再试。";
        updateConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantId ? { ...m, content: m.content || `出错了：${errorMsg}` } : m,
              ),
              updatedAt: Date.now(),
            };
          }),
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [activeId, conversations, isStreaming, updateConversations, createConversation],
  );

  /** 中止流式响应 */
  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  }, []);

  return {
    conversations,
    activeConversation,
    activeId,
    isStreaming,
    createConversation,
    deleteConversation,
    clearAll,
    renameConversation,
    selectConversation,
    sendMessage,
    stopStreaming,
  };
}
