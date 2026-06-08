/**
 * 聊天消息类型定义
 * @author 代长亚
 */
export type ChatRole = "user" | "assistant" | "system";

export type ChatCitation = {
  sutraSlug: string;
  sutraTitle: string;
  paragraphId: string;
  seq: number;
  snippet: string;
};

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: number;
  citations?: ChatCitation[];
}

export interface ChatConversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  context?: {
    sutraTitle: string;
    paragraphId?: string;
    text?: string;
  };
}
