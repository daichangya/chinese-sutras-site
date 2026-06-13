/**
 * 微信 OAuth 用户 upsert（UnionID 合并）
 * @author 代长亚
 */
import "server-only";
import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { getAuthDb } from "@/lib/auth/sqlite";
import { appUser, oauthIdentity } from "@/lib/auth/schema";
import type { AuthUser, WechatProvider } from "@/lib/auth/types";

export type ResolveWechatUserInput = {
  provider: WechatProvider;
  openid: string;
  unionId?: string | null;
  nickname?: string | null;
  avatarUrl?: string | null;
};

export async function resolveWechatUser(input: ResolveWechatUserInput): Promise<AuthUser> {
  const db = getAuthDb();
  const now = Date.now();
  const unionId = input.unionId?.trim() || null;
  const nickname = input.nickname?.trim() || null;
  const avatarUrl = input.avatarUrl?.trim() || null;

  const existingIdentity = await db
    .select()
    .from(oauthIdentity)
    .where(
      and(
        eq(oauthIdentity.provider, input.provider),
        eq(oauthIdentity.openid, input.openid),
      ),
    )
    .limit(1);

  let userId: string;

  if (existingIdentity[0]) {
    userId = existingIdentity[0].userId;
    if (unionId && !existingIdentity[0].unionId) {
      await db
        .update(oauthIdentity)
        .set({ unionId })
        .where(eq(oauthIdentity.id, existingIdentity[0].id));
    }
  } else if (unionId) {
    const byUnion = await db
      .select()
      .from(appUser)
      .where(eq(appUser.unionId, unionId))
      .limit(1);
    userId = byUnion[0]?.id ?? randomUUID();
  } else {
    userId = randomUUID();
  }

  const userRow = await db.select().from(appUser).where(eq(appUser.id, userId)).limit(1);

  if (!userRow[0]) {
    await db.insert(appUser).values({
      id: userId,
      unionId,
      nickname,
      avatarUrl,
      createdAt: now,
      lastLoginAt: now,
    });
  } else {
    await db
      .update(appUser)
      .set({
        unionId: unionId ?? userRow[0].unionId,
        nickname: nickname ?? userRow[0].nickname,
        avatarUrl: avatarUrl ?? userRow[0].avatarUrl,
        lastLoginAt: now,
      })
      .where(eq(appUser.id, userId));
  }

  if (!existingIdentity[0]) {
    await db.insert(oauthIdentity).values({
      id: randomUUID(),
      provider: input.provider,
      openid: input.openid,
      unionId,
      userId,
      createdAt: now,
    });
  }

  const finalUser = await db.select().from(appUser).where(eq(appUser.id, userId)).limit(1);
  const u = finalUser[0]!;
  return {
    id: u.id,
    unionId: u.unionId,
    nickname: u.nickname,
    avatarUrl: u.avatarUrl,
  };
}
