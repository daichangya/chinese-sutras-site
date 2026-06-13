/**
 * 微信服务号网页授权
 * @author 代长亚
 */
import "server-only";
import {
  getWechatMpConfig,
  wechatCallbackUrl,
} from "@/lib/auth/config";
import type { WechatTokenResponse, WechatUserInfo } from "@/lib/auth/types";

export type MpOAuthScope = "snsapi_base" | "snsapi_userinfo";

export function buildMpAuthUrl(state: string, scope: MpOAuthScope = "snsapi_userinfo"): string {
  const { appId } = getWechatMpConfig();
  const redirectUri = encodeURIComponent(wechatCallbackUrl());
  return (
    `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appId}` +
    `&redirect_uri=${redirectUri}&response_type=code&scope=${scope}` +
    `&state=${encodeURIComponent(state)}#wechat_redirect`
  );
}

export async function exchangeMpCode(code: string): Promise<{
  token: WechatTokenResponse;
  userInfo: WechatUserInfo | null;
}> {
  const { appId, appSecret } = getWechatMpConfig();
  const url =
    `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}` +
    `&secret=${appSecret}&code=${encodeURIComponent(code)}&grant_type=authorization_code`;
  const res = await fetch(url);
  const token = (await res.json()) as WechatTokenResponse;
  if (token.errcode || !token.access_token || !token.openid) {
    throw new Error(token.errmsg ?? "WeChat mp token exchange failed");
  }

  let userInfo: WechatUserInfo | null = null;
  if (token.scope?.includes("snsapi_userinfo")) {
    try {
      const infoUrl =
        `https://api.weixin.qq.com/sns/userinfo?access_token=${token.access_token}` +
        `&openid=${token.openid}&lang=zh_CN`;
      const infoRes = await fetch(infoUrl);
      userInfo = (await infoRes.json()) as WechatUserInfo;
      if (userInfo.errcode) userInfo = null;
    } catch {
      userInfo = null;
    }
  }

  return { token, userInfo };
}
