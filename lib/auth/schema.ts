/**
 * 账号库 Drizzle schema（独立于语料主库 jingxin.db）
 * @author 代长亚
 */
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

/** 登录用户 */
export const appUser = sqliteTable(
  "app_user",
  {
    id: text("id").primaryKey(),
    unionId: text("union_id").unique(),
    nickname: text("nickname"),
    avatarUrl: text("avatar_url"),
    createdAt: integer("created_at").notNull(),
    lastLoginAt: integer("last_login_at").notNull(),
  },
  (t) => [index("app_user_union_idx").on(t.unionId)],
);

/** 微信 OAuth 身份（开放平台 / 服务号） */
export const oauthIdentity = sqliteTable(
  "oauth_identity",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull(),
    openid: text("openid").notNull(),
    unionId: text("union_id"),
    userId: text("user_id")
      .notNull()
      .references(() => appUser.id),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [
    index("oauth_identity_user_idx").on(t.userId),
    index("oauth_identity_provider_openid_idx").on(t.provider, t.openid),
  ],
);

/** 登录会话 */
export const authSession = sqliteTable(
  "auth_session",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => appUser.id),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("auth_session_user_idx").on(t.userId)],
);
