/**
 * OAuth CSRF state 管理
 * @author 代长亚
 */
import "server-only";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import {
  AUTH_OAUTH_STATE_COOKIE,
  AUTH_RETURN_TO_COOKIE,
  AUTH_OAUTH_MODE_COOKIE,
} from "@/lib/auth/config";

const STATE_TTL_MS = 10 * 60 * 1000;

function shortCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}

export async function createOAuthState(
  returnTo?: string,
  mode: "qr" | "mp" = "qr",
): Promise<string> {
  const state = randomBytes(24).toString("hex");
  const jar = await cookies();
  jar.set(AUTH_OAUTH_STATE_COOKIE, state, shortCookieOptions(STATE_TTL_MS / 1000));
  jar.set(AUTH_OAUTH_MODE_COOKIE, mode, shortCookieOptions(STATE_TTL_MS / 1000));
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    jar.set(AUTH_RETURN_TO_COOKIE, returnTo, shortCookieOptions(STATE_TTL_MS / 1000));
  }
  return state;
}

export async function consumeOAuthState(
  stateFromQuery: string | null,
): Promise<{ ok: true; returnTo: string; mode: "qr" | "mp" } | { ok: false }> {
  const jar = await cookies();
  const expected = jar.get(AUTH_OAUTH_STATE_COOKIE)?.value;
  jar.delete(AUTH_OAUTH_STATE_COOKIE);
  const returnTo = jar.get(AUTH_RETURN_TO_COOKIE)?.value ?? "/account";
  jar.delete(AUTH_RETURN_TO_COOKIE);
  const modeRaw = jar.get(AUTH_OAUTH_MODE_COOKIE)?.value;
  jar.delete(AUTH_OAUTH_MODE_COOKIE);
  const mode: "qr" | "mp" = modeRaw === "mp" ? "mp" : "qr";

  if (!expected || !stateFromQuery || expected !== stateFromQuery) {
    return { ok: false };
  }
  const safeReturn =
    returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/account";
  return { ok: true, returnTo: safeReturn, mode };
}
