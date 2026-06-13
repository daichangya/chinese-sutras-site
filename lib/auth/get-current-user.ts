/**
 * 读取当前登录用户
 * @author 代长亚
 */
import "server-only";
import { getSessionUser } from "@/lib/auth/session";
import type { SessionUser } from "@/lib/auth/types";

export async function getCurrentUser(): Promise<SessionUser | null> {
  return getSessionUser();
}
