/**
 * 阅读进度持久化（localStorage userKey + API）
 * @author 代长亚
 */
"use client";

import { useEffect } from "react";

const USER_KEY_STORAGE = "jingxin-device-id";

/** 匿名设备 ID（仅用于未登录时的本地合并） */
export function getDeviceKey(): string {
  return getUserKey();
}

export function getUserKey(): string {
  if (typeof window === "undefined") return "server";
  let key = localStorage.getItem(USER_KEY_STORAGE);
  if (!key) {
    key = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(USER_KEY_STORAGE, key);
  }
  return key;
}

export function useReadingProgress({
  sutraId,
  sutraSlug,
  sutraTitle,
  activeParagraphId,
}: {
  sutraId: string;
  sutraSlug: string;
  sutraTitle: string;
  activeParagraphId?: string;
}) {
  useEffect(() => {
    if (!activeParagraphId) return;
    const userKey = getUserKey();
    const timer = window.setTimeout(() => {
      fetch("/api/reading/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userKey,
          sutraId,
          sutraSlug,
          sutraTitle,
          paragraphId: activeParagraphId,
          scrollY: window.scrollY,
        }),
      }).catch(() => {});
    }, 800);
    return () => window.clearTimeout(timer);
  }, [activeParagraphId, sutraId, sutraSlug, sutraTitle]);
}
