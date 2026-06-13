/**
 * 登录会话管理
 * @author 代长亚
 */
import "server-only";
import { randomUUID } from "crypto";
import { cookies } from "next/headers";
import { eq, lt } from "drizzle-orm";
import { getAuthDb } from "@/lib/auth/sqlite";
import { appUser, authSession, oauthIdentity } from "@/lib/auth/schema";
import {
  AUTH_SESSION_COOKIE,
  getAuthSessionTtlMs,
} from "@/lib/auth/config";
import type { SessionUser, WechatProvider } from "@/lib/auth/types";

function cookieOptions(expiresAt: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(expiresAt),
  };
}

export async function createSession(userId: string): Promise<string> {
  const db = getAuthDb();
  const now = Date.now();
  const expiresAt = now + getAuthSessionTtlMs();
  const sessionId = randomUUID();

  await db.insert(authSession).values({
    id: sessionId,
    userId,
    expiresAt,
    createdAt: now,
  });

  const jar = await cookies();
  jar.set(AUTH_SESSION_COOKIE, sessionId, cookieOptions(expiresAt));
  return sessionId;
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const sessionId = jar.get(AUTH_SESSION_COOKIE)?.value;
  if (sessionId) {
    const db = getAuthDb();
    await db.delete(authSession).where(eq(authSession.id, sessionId));
  }
  jar.delete(AUTH_SESSION_COOKIE);
}

export async function purgeExpiredSessions(): Promise<void> {
  const db = getAuthDb();
  await db.delete(authSession).where(lt(authSession.expiresAt, Date.now()));
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const sessionId = jar.get(AUTH_SESSION_COOKIE)?.value;
  if (!sessionId) return null;

  const db = getAuthDb();
  const row = await db
    .select({
      sessionId: authSession.id,
      expiresAt: authSession.expiresAt,
      userId: appUser.id,
      unionId: appUser.unionId,
      nickname: appUser.nickname,
      avatarUrl: appUser.avatarUrl,
    })
    .from(authSession)
    .innerJoin(appUser, eq(authSession.userId, appUser.id))
    .where(eq(authSession.id, sessionId))
    .limit(1);

  const hit = row[0];
  if (!hit || hit.expiresAt <= Date.now()) {
    if (hit) {
      await db.delete(authSession).where(eq(authSession.id, sessionId));
    }
    jar.delete(AUTH_SESSION_COOKIE);
    return null;
  }

  const providers = await db
    .select({ provider: oauthIdentity.provider })
    .from(oauthIdentity)
    .where(eq(oauthIdentity.userId, hit.userId));

  return {
    id: hit.userId,
    unionId: hit.unionId,
    nickname: hit.nickname,
    avatarUrl: hit.avatarUrl,
    providers: providers.map((p) => p.provider as WechatProvider),
  };
}
