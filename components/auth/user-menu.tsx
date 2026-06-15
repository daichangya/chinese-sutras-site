/**
 * 顶栏用户菜单
 * @author 代长亚
 */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogIn, LogOut, User } from "lucide-react";
import { fetchAuthSession, logout, type AuthSessionResponse } from "@/lib/auth/client";
import { isWechatLoginEnabled } from "@/lib/auth/feature";
import { cn } from "@/lib/utils";

export function UserMenu({ compact }: { compact?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [session, setSession] = useState<AuthSessionResponse | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchAuthSession()
      .then(setSession)
      .catch(() => setSession({ loggedIn: false, user: null }));
  }, []);

  // 挂载前保持 SSR 与首屏一致，避免登录入口与顶栏后续节点 hydration 错位
  if (!mounted) {
    return null;
  }

  const loginEnabled = isWechatLoginEnabled();

  async function handleLogout() {
    await logout();
    setSession({ loggedIn: false, user: null });
    setOpen(false);
    window.location.href = "/";
  }

  if (!loginEnabled) {
    if (!session?.loggedIn || !session.user) return null;
  }

  if (!session) {
    if (!loginEnabled) return null;
    return (
      <Link
        href="/login"
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[var(--jx-muted-label)] hover:bg-[var(--jx-paper-deep)] hover:text-[var(--foreground)] transition-colors",
          compact && "justify-center",
        )}
        aria-label="微信登录"
      >
        <LogIn className="size-4 shrink-0" aria-hidden="true" />
        {!compact ? <span>登录</span> : null}
      </Link>
    );
  }

  if (!session.loggedIn || !session.user) {
    if (!loginEnabled) return null;
    return (
      <Link
        href="/login"
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-[var(--jx-muted-label)] hover:bg-[var(--jx-paper-deep)] hover:text-[var(--foreground)] transition-colors",
          compact && "justify-center",
        )}
      >
        <LogIn className="size-4 shrink-0" aria-hidden="true" />
        {!compact ? <span>微信登录</span> : null}
      </Link>
    );
  }

  const { user } = session;
  const label = user.nickname ?? "已登录";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-[var(--jx-paper-deep)] transition-colors cursor-pointer max-w-[140px]"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt=""
            className="size-7 rounded-full object-cover shrink-0"
          />
        ) : (
          <span className="flex size-7 items-center justify-center rounded-full bg-[var(--jx-paper-deep)] text-[var(--jx-muted-label)]">
            <User className="size-4" aria-hidden="true" />
          </span>
        )}
        {!compact ? (
          <span className="truncate text-[var(--foreground)]">{label}</span>
        ) : null}
      </button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="关闭菜单"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 top-full z-50 mt-1 min-w-[160px] rounded-md border border-[var(--jx-border)] bg-[var(--jx-paper)] py-1 shadow-lg"
          >
            <Link
              href="/account"
              role="menuitem"
              className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--jx-paper-deep)]"
              onClick={() => setOpen(false)}
            >
              <User className="size-4 opacity-70" aria-hidden="true" />
              个人中心
            </Link>
            <button
              type="button"
              role="menuitem"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--jx-paper-deep)] cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="size-4 opacity-70" aria-hidden="true" />
              退出登录
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
