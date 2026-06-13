/**
 * API 身份解析（登录用户 / 匿名 deviceKey）
 * @author 代长亚
 */
import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import type { SessionUser } from "@/lib/auth/types";

const DEVICE_KEY_RE = /^dev_[a-zA-Z0-9_]+$/;

export type AuthContext = {
  user: SessionUser | null;
  /** 写入 reading_progress / sync 等表的 key：登录用 user.id，未登录用 deviceKey */
  dataKey: string;
  deviceKey: string | null;
  loggedIn: boolean;
};

export function isValidDeviceKey(key: string | null | undefined): key is string {
  return Boolean(key && DEVICE_KEY_RE.test(key) && key.length <= 128);
}

export async function resolveAuthContext(
  deviceKeyFromRequest?: string | null,
): Promise<AuthContext> {
  const user = await getCurrentUser();
  const deviceKey = isValidDeviceKey(deviceKeyFromRequest) ? deviceKeyFromRequest : null;

  if (user) {
    return {
      user,
      dataKey: user.id,
      deviceKey,
      loggedIn: true,
    };
  }

  return {
    user: null,
    dataKey: deviceKey ?? "",
    deviceKey,
    loggedIn: false,
  };
}

export async function requireLoggedIn(): Promise<
  { user: SessionUser } | NextResponse
> {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { user };
}

export async function requireDataAccess(
  deviceKeyFromRequest?: string | null,
): Promise<{ ctx: AuthContext } | NextResponse> {
  const ctx = await resolveAuthContext(deviceKeyFromRequest);
  if (!ctx.loggedIn && !ctx.dataKey) {
    return NextResponse.json({ error: "userKey required" }, { status: 400 });
  }
  return { ctx };
}
