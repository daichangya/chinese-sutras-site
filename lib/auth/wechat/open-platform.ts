/**
 * 微信开放平台 PC 扫码登录
 * @author 代长亚
 */
import "server-only";
import {
  getWechatOpenConfig,
  wechatCallbackUrl,
} from "@/lib/auth/config";
import type { WechatTokenResponse, WechatUserInfo } from "@/lib/auth/types";

export function buildOpenPlatformAuthUrl(state: string): string {
  const { appId } = getWechatOpenConfig();
  const redirectUri = encodeURIComponent(wechatCallbackUrl());
  return (
    `https://open.weixin.qq.com/connect/qrconnect?appid=${appId}` +
    `&redirect_uri=${redirectUri}&response_type=code&scope=snsapi_login` +
    `&state=${encodeURIComponent(state)}#wechat_redirect`
  );
}

export async function exchangeOpenPlatformCode(code: string): Promise<{
  token: WechatTokenResponse;
  userInfo: WechatUserInfo | null;
}> {
  const { appId, appSecret } = getWechatOpenConfig();
  const url =
    `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${appId}` +
    `&secret=${appSecret}&code=${encodeURIComponent(code)}&grant_type=authorization_code`;
  const res = await fetch(url);
  const token = (await res.json()) as WechatTokenResponse;
  if (token.errcode || !token.access_token || !token.openid) {
    throw new Error(token.errmsg ?? "WeChat open token exchange failed");
  }

  let userInfo: WechatUserInfo | null = null;
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

  return { token, userInfo };
}
