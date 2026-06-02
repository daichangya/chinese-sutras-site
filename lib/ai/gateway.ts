/**
 * AI Gateway 客户端
 * @author jingxin
 */
export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export function isAiMockMode(): boolean {
  return process.env.AI_MOCK === "1" || process.env.AI_MOCK === "true";
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
    return "（未配置 AI_GATEWAY_URL，请在 .env 中设置后启用 AI 功能。）";
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
