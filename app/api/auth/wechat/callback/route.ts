/**
 * 微信 OAuth 统一回调
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/auth/config";
import { isWechatLoginEnabled } from "@/lib/auth/feature";
import { createSession } from "@/lib/auth/session";
import { mergeDeviceDataToUser } from "@/lib/auth/merge-device-data";
import { exchangeMpCode } from "@/lib/auth/wechat/mp-oauth";
import { exchangeOpenPlatformCode } from "@/lib/auth/wechat/open-platform";
import { resolveWechatUser } from "@/lib/auth/wechat/resolve-user";
import { consumeOAuthState } from "@/lib/auth/wechat/state";
import { isValidDeviceKey } from "@/lib/auth/require-user";

export async function GET(req: Request) {
  if (!isWechatLoginEnabled()) {
    return NextResponse.redirect(`${getSiteUrl()}/`);
  }

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const deviceKey = searchParams.get("deviceKey");

  const stateResult = await consumeOAuthState(state);
  if (!stateResult.ok) {
    return NextResponse.redirect(`${getSiteUrl()}/login?error=invalid_state`);
  }

  const mode = stateResult.mode;

  if (!code) {
    return NextResponse.redirect(`${getSiteUrl()}/login?error=missing_code`);
  }

  try {
    const provider = mode === "mp" ? "wechat_mp" : "wechat_open";
    const { token, userInfo } =
      mode === "mp" ? await exchangeMpCode(code) : await exchangeOpenPlatformCode(code);

    const user = await resolveWechatUser({
      provider,
      openid: token.openid!,
      unionId: token.unionid ?? userInfo?.unionid ?? null,
      nickname: userInfo?.nickname ?? null,
      avatarUrl: userInfo?.headimgurl ?? null,
    });

    await createSession(user.id);

    if (isValidDeviceKey(deviceKey)) {
      mergeDeviceDataToUser(user.id, deviceKey);
    }

    return NextResponse.redirect(`${getSiteUrl()}${stateResult.returnTo}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "oauth_failed";
    return NextResponse.redirect(
      `${getSiteUrl()}/login?error=${encodeURIComponent(msg)}`,
    );
  }
}
