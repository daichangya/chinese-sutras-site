/**
 * 当前登录会话
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({
    loggedIn: Boolean(user),
    user,
  });
}
