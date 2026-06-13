/**
 * 微信登录面板（PC 扫码 + 微信内授权）
 * @author 代长亚
 */
"use client";

import { useEffect, useRef } from "react";
import { getDeviceKey } from "@/lib/reader/use-reading-progress";
import { isWechatBrowser, wechatLoginUrl } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    WxLogin?: new (options: Record<string, string | boolean>) => void;
  }
}

type WechatLoginPanelProps = {
  qrState: string;
  openAppId: string;
  callbackUrl: string;
  mpConfigured: boolean;
  openConfigured: boolean;
  error?: string | null;
};

export function WechatLoginPanel({
  qrState,
  openAppId,
  callbackUrl,
  mpConfigured,
  openConfigured,
  error,
}: WechatLoginPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const redirectedRef = useRef(false);

  useEffect(() => {
    if (redirectedRef.current) return;
    if (isWechatBrowser() && mpConfigured) {
      redirectedRef.current = true;
      const deviceKey = getDeviceKey();
      window.location.href = `${wechatLoginUrl({ mode: "mp", returnTo: "/account" })}&deviceKey=${encodeURIComponent(deviceKey)}`;
    }
  }, [mpConfigured]);

  useEffect(() => {
    if (!openConfigured || !openAppId || !containerRef.current || isWechatBrowser()) return;

    const script = document.createElement("script");
    script.src = "https://res.wx.qq.com/connect/zh_CN/htmledition/js/wxLogin.js";
    script.async = true;
    script.onload = () => {
      if (!containerRef.current || !window.WxLogin) return;
      containerRef.current.innerHTML = "";
      new window.WxLogin({
        self_redirect: false,
        id: containerRef.current.id,
        appid: openAppId,
        scope: "snsapi_login",
        redirect_uri: encodeURIComponent(callbackUrl),
        state: qrState,
        style: "black",
        href: "",
      });
    };
    document.body.appendChild(script);
    return () => {
      script.remove();
    };
  }, [openAppId, callbackUrl, openConfigured, qrState]);

  return (
    <div className="flex flex-col items-center gap-6">
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          登录失败：{decodeURIComponent(error)}
        </p>
      ) : null}

      {isWechatBrowser() ? (
        <div className="text-center text-sm text-[var(--jx-muted-label)]">
          {mpConfigured ? (
            <p>正在跳转微信授权…</p>
          ) : (
            <p>服务号网页授权尚未配置，请联系管理员。</p>
          )}
        </div>
      ) : openConfigured ? (
        <div
          id="wechat-login-container"
          ref={containerRef}
          className={cn("min-h-[300px] flex items-center justify-center")}
          aria-label="微信扫码登录"
        />
      ) : (
        <div className="rounded-lg border border-[var(--jx-border)] bg-[var(--jx-paper-deep)] px-6 py-8 text-center text-sm text-[var(--jx-muted-label)]">
          <p className="mb-4">PC 扫码登录尚未配置。</p>
          {mpConfigured ? (
            <a
              href={wechatLoginUrl({ mode: "mp", returnTo: "/account" })}
              className="text-[var(--jx-accent-cinnabar)] underline-offset-2 hover:underline"
            >
              在微信中打开并授权
            </a>
          ) : null}
        </div>
      )}

      <p className="max-w-md text-center text-xs text-[var(--jx-muted-label)] leading-relaxed">
        登录可选。未登录仍可阅读、搜索与本地收藏；登录后可跨设备同步阅读进度与书签。
      </p>
    </div>
  );
}
