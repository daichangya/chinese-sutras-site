/**
 * 配置已就绪但对话里仍显示旧「未配置」错误时的提示条
 * @author 代长亚
 */
"use client";

import { useEffect, useState } from "react";
import { isGatewayUnconfiguredMessage } from "@/lib/ai/gateway";
import type { ChatMessage } from "@/lib/chat/types";

interface ChatStaleConfigBannerProps {
  messages: ChatMessage[];
  onCreateNew: () => void;
}

export function ChatStaleConfigBanner({ messages, onCreateNew }: ChatStaleConfigBannerProps) {
  const [gatewayReady, setGatewayReady] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/ai/status")
      .then((res) => res.json() as Promise<{ configured?: boolean }>)
      .then((data) => {
        if (!cancelled) setGatewayReady(Boolean(data.configured));
      })
      .catch(() => {
        if (!cancelled) setGatewayReady(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasStaleConfigError = messages.some(
    (m) => m.role === "assistant" && isGatewayUnconfiguredMessage(m.content),
  );

  if (gatewayReady !== true || !hasStaleConfigError) {
    return null;
  }

  return (
    <div
      className="mx-4 mb-3 rounded-xl bg-[var(--jx-accent-cinnabar)]/10 px-4 py-3 text-sm text-[var(--foreground)]"
      role="status"
      data-testid="chat-stale-config-banner"
    >
      <p>
        AI 已配置完成，当前对话中的「未配置」是<strong>之前保存在浏览器里的旧回复</strong>
        ，不是最新请求结果。
      </p>
      <button
        type="button"
        className="mt-2 font-medium text-[var(--jx-accent-cinnabar)] underline-offset-2 hover:underline"
        onClick={onCreateNew}
      >
        新建对话并重试
      </button>
    </div>
  );
}
