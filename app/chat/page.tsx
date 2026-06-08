/**
 * AI 对话独立页面
 * @author 代长亚
 */
"use client";

import { useCallback, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ChatShell } from "@/components/chat/chat-shell";
import { useChat } from "@/lib/chat/use-chat";

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const {
    conversations,
    activeConversation,
    activeId,
    isStreaming,
    createConversation,
    deleteConversation,
    clearAll,
    selectConversation,
    sendMessage,
    stopStreaming,
  } = useChat();

  useEffect(() => {
    const contextText = searchParams.get("text");
    const sutraTitle = searchParams.get("sutraTitle");
    const paragraphId = searchParams.get("paragraphId");

    if (contextText || sutraTitle) {
      createConversation({
        sutraTitle: sutraTitle ?? "",
        paragraphId: paragraphId ?? undefined,
        text: contextText ?? undefined,
      });
      router.replace("/chat");
      if (contextText) {
        setTimeout(() => {
          sendMessage(
            `请帮我理解这段经文：\n\n「${contextText}」\n\n出自《${sutraTitle ?? "佛经"}》。`,
          );
        }, 100);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount for URL context
  }, []);

  const handleCreateNew = useCallback(() => {
    createConversation();
  }, [createConversation]);

  const handleSend = useCallback(
    (text: string) => {
      if (!activeId) {
        createConversation();
        setTimeout(() => sendMessage(text), 100);
      } else {
        sendMessage(text);
      }
    },
    [activeId, createConversation, sendMessage],
  );

  return (
    <ChatShell
      conversations={conversations}
      activeConversation={activeConversation}
      activeId={activeId}
      isStreaming={isStreaming}
      onSelectConversation={selectConversation}
      onCreateNew={handleCreateNew}
      onDeleteConversation={deleteConversation}
      onClearAll={clearAll}
      onSend={handleSend}
      onStop={stopStreaming}
    />
  );
}
