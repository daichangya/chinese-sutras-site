/**
 * AI 对话流式 API 端点（含 FTS RAG 引用）
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { chatCompletionStream, isAiMockMode } from "@/lib/ai/gateway";
import { retrieveRagContext, type RagCitation } from "@/lib/ai/rag-retrieval";
import { brandAiSystemRole } from "@/lib/brand";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: Array<{ role: string; content: string }>;
    context?: {
      sutraTitle?: string;
      text?: string;
    };
  };

  const messages = body.messages ?? [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "messages required" }, { status: 400 });
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const rag = retrieveRagContext(lastUser, {
    sutraTitle: body.context?.sutraTitle,
    contextText: body.context?.text,
    limit: 5,
  });

  const systemPrompt = buildChatSystemPrompt(body.context, rag.contextText);

  const fullMessages = [
    { role: "system" as const, content: systemPrompt },
    ...messages.map((m) => ({
      role: (m.role === "system" ? "system" : m.role === "user" ? "user" : "assistant") as
        | "system"
        | "user"
        | "assistant",
      content: m.content,
    })),
  ];

  const upstream = await chatCompletionStream(fullMessages);
  const citations = rag.citations;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const reader = upstream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ delta: "", done: true, citations })}\n\n`),
        );
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function buildChatSystemPrompt(
  context?: { sutraTitle?: string; text?: string },
  ragContext?: string,
): string {
  let base =
    `${brandAiSystemRole()}你熟悉汉传佛教大藏经（CBETA）中的经典文献。` +
    "请用温暖、简洁、有智慧的现代汉语与用户对话。" +
    "回答应基于佛法义理，但不宣扬迷信，保持理性与开放。" +
    "如果不确定，请如实说明，不要虚构经名、卷号或历史事件。" +
    "若提供了检索到的经文片段，请优先依据这些片段回答，并在正文中用 [1][2] 标注引用序号。";

  if (context?.sutraTitle) {
    base += `\n当前对话基于经文《${context.sutraTitle}》。`;
  }
  if (context?.text) {
    base += `\n用户选定的经文片段：${context.text}`;
  }
  if (ragContext) {
    base += `\n\n以下是从经藏检索到的相关段落，供你参考：\n${ragContext}`;
  }

  if (isAiMockMode()) {
    base += "\n（当前为模拟模式）";
  }

  return base;
}

export type { RagCitation };
