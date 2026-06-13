/**
 * 个人中心操作（登出、手动合并）
 * @author 代长亚
 */
"use client";

import { useEffect, useState } from "react";
import { logout, mergeDeviceData } from "@/lib/auth/client";
import { getDeviceKey } from "@/lib/reader/use-reading-progress";

export function AccountActions() {
  const [mergeStatus, setMergeStatus] = useState<string | null>(null);

  useEffect(() => {
    const deviceKey = getDeviceKey();
    mergeDeviceData(deviceKey)
      .then(() => setMergeStatus("本设备数据已合并"))
      .catch(() => setMergeStatus(null));
  }, []);

  async function handleLogout() {
    await logout();
    window.location.href = "/";
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {mergeStatus ? (
        <span className="text-xs text-[var(--jx-muted-label)]">{mergeStatus}</span>
      ) : null}
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md border border-[var(--jx-border)] px-4 py-2 text-sm hover:bg-[var(--jx-paper)] transition-colors cursor-pointer"
      >
        退出登录
      </button>
    </div>
  );
}
