"use client";

/**
 * 根布局用户数据后台同步
 * @author 代长亚
 */
import { useUserDataSync } from "@/lib/user/use-user-data-sync";

export function UserDataSync() {
  useUserDataSync();
  return null;
}
