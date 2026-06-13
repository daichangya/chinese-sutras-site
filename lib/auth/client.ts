/**
 * 客户端认证辅助
 * @author 代长亚
 */
"use client";

import type { SessionUser } from "@/lib/auth/types";

export type AuthSessionResponse = {
  loggedIn: boolean;
  user: SessionUser | null;
};

export async function fetchAuthSession(): Promise<AuthSessionResponse> {
  const res = await fetch("/api/auth/session", { credentials: "include" });
  if (!res.ok) {
    return { loggedIn: false, user: null };
  }
  return (await res.json()) as AuthSessionResponse;
}

export async function logout(): Promise<void> {
  await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
}

export function wechatLoginUrl(options?: {
  mode?: "qr" | "mp";
  returnTo?: string;
  deviceKey?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.mode) params.set("mode", options.mode);
  if (options?.returnTo) params.set("returnTo", options.returnTo);
  const base = `/api/auth/wechat?${params.toString()}`;
  return base;
}

export async function mergeDeviceData(deviceKey: string): Promise<void> {
  await fetch("/api/auth/merge", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deviceKey }),
  });
}

export function isWechatBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  return /MicroMessenger/i.test(navigator.userAgent);
}
