/**
 * 登录后合并匿名 deviceKey 数据
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { mergeDeviceDataToUser } from "@/lib/auth/merge-device-data";
import { requireLoggedIn, isValidDeviceKey } from "@/lib/auth/require-user";

export async function POST(req: Request) {
  const auth = await requireLoggedIn();
  if (auth instanceof NextResponse) return auth;

  const body = (await req.json()) as { deviceKey?: string };
  const deviceKey = body.deviceKey?.trim();
  if (!isValidDeviceKey(deviceKey)) {
    return NextResponse.json({ error: "valid deviceKey required" }, { status: 400 });
  }

  const merged = mergeDeviceDataToUser(auth.user.id, deviceKey);
  return NextResponse.json({ ok: true, merged });
}
