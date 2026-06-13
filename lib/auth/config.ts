/**
 * 认证环境配置
 * @author 代长亚
 */
import "server-only";

export const AUTH_SESSION_COOKIE = "jx_session";
export const AUTH_OAUTH_STATE_COOKIE = "jx_oauth_state";
export const AUTH_RETURN_TO_COOKIE = "jx_auth_return_to";
export const AUTH_OAUTH_MODE_COOKIE = "jx_oauth_mode";

function required(name: string, value: string | undefined): string {
  if (!value?.trim()) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value.trim();
}

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return url.replace(/\/$/, "");
}

export function getAuthSessionSecret(): string {
  return (
    process.env.AUTH_SESSION_SECRET?.trim() ||
    (process.env.NODE_ENV === "production" ? required("AUTH_SESSION_SECRET", "") : "dev-insecure-session-secret")
  );
}

export function getAuthSessionTtlMs(): number {
  const days = Number(process.env.AUTH_SESSION_TTL_DAYS ?? "30");
  return (Number.isFinite(days) && days > 0 ? days : 30) * 24 * 60 * 60 * 1000;
}

export function getWechatOpenConfig() {
  return {
    appId: process.env.WECHAT_OPEN_APP_ID?.trim() ?? "",
    appSecret: process.env.WECHAT_OPEN_APP_SECRET?.trim() ?? "",
  };
}

export function getWechatMpConfig() {
  return {
    appId: process.env.WECHAT_MP_APP_ID?.trim() ?? "",
    appSecret: process.env.WECHAT_MP_APP_SECRET?.trim() ?? "",
  };
}

export function wechatCallbackUrl(): string {
  return `${getSiteUrl()}/api/auth/wechat/callback`;
}

export function isWechatConfigured(mode: "open" | "mp"): boolean {
  const cfg = mode === "open" ? getWechatOpenConfig() : getWechatMpConfig();
  return Boolean(cfg.appId && cfg.appSecret);
}
