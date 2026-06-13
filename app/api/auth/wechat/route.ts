/**
 * 微信 OAuth 入口（PC 扫码 / 服务号网页授权）
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { isWechatConfigured } from "@/lib/auth/config";
import { isWechatLoginEnabled } from "@/lib/auth/feature";
import { buildMpAuthUrl } from "@/lib/auth/wechat/mp-oauth";
import { buildOpenPlatformAuthUrl } from "@/lib/auth/wechat/open-platform";
import { createOAuthState } from "@/lib/auth/wechat/state";

function detectMode(req: Request, explicit: string | null): "qr" | "mp" {
  if (explicit === "qr" || explicit === "mp") return explicit;
  const ua = req.headers.get("user-agent") ?? "";
  if (/MicroMessenger/i.test(ua)) return "mp";
  return "qr";
}

export async function GET(req: Request) {
  if (!isWechatLoginEnabled()) {
    return NextResponse.json({ error: "WeChat login disabled" }, { status: 404 });
  }

  const { searchParams } = new URL(req.url);
  const mode = detectMode(req, searchParams.get("mode"));
  const returnTo = searchParams.get("returnTo") ?? undefined;

  if (mode === "mp" && !isWechatConfigured("mp")) {
    return NextResponse.json({ error: "WeChat MP OAuth not configured" }, { status: 503 });
  }
  if (mode === "qr" && !isWechatConfigured("open")) {
    return NextResponse.json({ error: "WeChat Open Platform not configured" }, { status: 503 });
  }

  const state = await createOAuthState(returnTo, mode);
  const url = mode === "mp" ? buildMpAuthUrl(state) : buildOpenPlatformAuthUrl(state);
  return NextResponse.redirect(url);
}
