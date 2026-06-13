/**
 * Mock 微信 OAuth（仅开发/测试）
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/auth/config";
import { createSession } from "@/lib/auth/session";
import { resolveWechatUser } from "@/lib/auth/wechat/resolve-user";
import { createOAuthState, consumeOAuthState } from "@/lib/auth/wechat/state";

function mockEnabled(): boolean {
  return (
    process.env.AUTH_MOCK_WECHAT === "1" ||
    process.env.NODE_ENV === "test" ||
    process.env.NODE_ENV === "development"
  );
}

/** GET：模拟 OAuth 回调，创建测试用户与会话 */
export async function GET(req: Request) {
  if (!mockEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const state = searchParams.get("state");
  const nickname = searchParams.get("nickname") ?? "测试用户";
  const unionId = searchParams.get("unionId") ?? "mock_union_1";
  const openid = searchParams.get("openid") ?? `mock_open_${Date.now()}`;
  const mode = searchParams.get("mode") === "mp" ? "wechat_mp" : "wechat_open";

  const stateResult = await consumeOAuthState(state);
  const returnTo = stateResult.ok ? stateResult.returnTo : "/account";

  const user = await resolveWechatUser({
    provider: mode,
    openid,
    unionId,
    nickname,
    avatarUrl: null,
  });

  await createSession(user.id);
  return NextResponse.redirect(`${getSiteUrl()}${returnTo}`);
}

/** POST：生成 mock 登录 URL（供 E2E 使用） */
export async function POST(req: Request) {
  if (!mockEnabled()) {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  const body = (await req.json()) as { returnTo?: string; mode?: "qr" | "mp" };
  const state = await createOAuthState(body.returnTo ?? "/account", body.mode ?? "qr");
  const url = `${getSiteUrl()}/api/auth/wechat/mock?state=${encodeURIComponent(state)}&unionId=mock_union_e2e&nickname=E2E用户`;
  return NextResponse.json({ url, state });
}
