/**
 * 认证类型定义
 * @author 代长亚
 */

export type WechatProvider = "wechat_open" | "wechat_mp";

export type AuthUser = {
  id: string;
  unionId: string | null;
  nickname: string | null;
  avatarUrl: string | null;
};

export type SessionUser = AuthUser & {
  providers: WechatProvider[];
};

export type WechatTokenResponse = {
  access_token?: string;
  expires_in?: number;
  refresh_token?: string;
  openid?: string;
  scope?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
};

export type WechatUserInfo = {
  openid?: string;
  nickname?: string;
  headimgurl?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
};
