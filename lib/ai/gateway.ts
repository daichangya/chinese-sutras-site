/**
 * AI Gateway 客户端
 * @author 代长亚
 */
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

/** 未配置 Gateway 时返回给用户的提示（也会写入 localStorage，需配合新建对话） */
export const AI_GATEWAY_UNCONFIGURED_HINT =
  "（未配置 AI_GATEWAY_URL，请在 .env 中设置后启用 AI 功能。）";

export function isAiMockMode(): boolean {
  return process.env.AI_MOCK === "1" || process.env.AI_MOCK === "true";
}

export function isAiGatewayConfigured(): boolean {
  return isAiMockMode() || Boolean(process.env.AI_GATEWAY_URL?.trim());
}

export function isGatewayUnconfiguredMessage(content: string): boolean {
  return content.includes("未配置 AI_GATEWAY_URL");
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  if (isAiMockMode()) {
    const user = messages.find((m) => m.role === "user")?.content ?? "";
    return `【模拟解释】${user.slice(0, 40)}… 仅供测试，非真实 AI 输出。`;
  }

  const url = process.env.AI_GATEWAY_URL;
  const apiKey = process.env.AI_GATEWAY_API_KEY ?? "";
  const model = process.env.AI_MODEL ?? "deepseek-chat";

  if (!url) {
    return AI_GATEWAY_UNCONFIGURED_HINT;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ model, messages, temperature: 0.3 }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gateway error ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

/**
 * 流式对话完成 — 返回 ReadableStream
 * 每 chunk 以 SSE 格式推送：data: {"delta":"...","done":false}\n\n
 */
export async function chatCompletionStream(
  messages: ChatMessage[],
): Promise<ReadableStream<Uint8Array>> {
  if (isAiMockMode()) {
    const user = messages.find((m) => m.role === "user")?.content ?? "";
    const mock = `【模拟回复】${user.slice(0, 60)}… 仅供测试，非真实 AI 输出。`;
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encodeSSE({ delta: mock, done: false }));
        controller.enqueue(encodeSSE({ delta: "", done: true }));
        controller.close();
      },
    });
  }

  const url = process.env.AI_GATEWAY_URL;
  const apiKey = process.env.AI_GATEWAY_API_KEY ?? "";
  const model = process.env.AI_MODEL ?? "deepseek-chat";

  if (!url) {
    const fallback = AI_GATEWAY_UNCONFIGURED_HINT;
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encodeSSE({ delta: fallback, done: true }));
        controller.close();
      },
    });
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ model, messages, temperature: 0.7, stream: true }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gateway error ${res.status}: ${body.slice(0, 200)}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable as a stream");
  }

  return normalizeUpstreamSseStream(reader);
}

/** 从上游 SSE JSON（OpenAI 兼容或内部格式）提取文本增量 */
export function extractStreamDelta(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const obj = payload as {
    delta?: string;
    choices?: Array<{ delta?: { content?: string }; message?: { content?: string } }>;
  };
  if (typeof obj.delta === "string") return obj.delta;
  const choice = obj.choices?.[0];
  return choice?.delta?.content ?? choice?.message?.content ?? "";
}

function normalizeUpstreamSseStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): ReadableStream<Uint8Array> {
  return new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          buffer = flushSseBuffer(buffer, controller);
        }
        if (buffer.trim()) {
          for (const line of buffer.split("\n")) {
            emitNormalizedSseLine(line, controller);
          }
        }
        controller.enqueue(encodeSSE({ delta: "", done: true }));
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
    cancel() {
      reader.cancel();
    },
  });
}

function flushSseBuffer(
  buffer: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
): string {
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";
  for (const line of lines) {
    emitNormalizedSseLine(line, controller);
  }
  return rest;
}

function emitNormalizedSseLine(
  line: string,
  controller: ReadableStreamDefaultController<Uint8Array>,
): void {
  const trimmed = line.trim();
  if (!trimmed.startsWith("data:")) return;
  const payload = trimmed.slice(5).trim();
  if (!payload || payload === "[DONE]") return;
  try {
    const json = JSON.parse(payload) as { done?: boolean };
    if (json.done === true) return;
    const delta = extractStreamDelta(json);
    if (delta) {
      controller.enqueue(encodeSSE({ delta, done: false }));
    }
  } catch {
    // 跳过畸形 SSE 行
  }
}

function encodeSSE(data: { delta: string; done: boolean }): Uint8Array {
  const text = `data: ${JSON.stringify(data)}\n\n`;
  return new TextEncoder().encode(text);
}
