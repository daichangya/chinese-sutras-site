/**
 * 个人中心
 * @author 代长亚
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { AccountActions } from "@/components/auth/account-actions";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isWechatLoginEnabled } from "@/lib/auth/feature";
import { getBrandIconChar, getBrandName } from "@/lib/brand";

const PROVIDER_LABEL: Record<string, string> = {
  wechat_open: "微信开放平台（PC 扫码）",
  wechat_mp: "微信服务号（网页授权）",
};

export default async function AccountPage() {
  if (!isWechatLoginEnabled()) {
    redirect("/");
  }

  const user = await getCurrentUser();
  const brandName = getBrandName();
  const brandIconChar = getBrandIconChar();
  if (!user) {
    redirect("/login?returnTo=/account");
  }

  return (
    <PageShell narrow className="py-10">
      <PageHeader
        label="账号"
        title="个人中心"
        description="账号与数据同步"
      />

      <div className="mt-8 flex flex-col gap-6 rounded-lg border border-[var(--jx-border)] bg-[var(--jx-paper-deep)] p-6">
        <div className="flex items-center gap-4">
          {user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              className="size-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-full bg-[var(--jx-paper)] text-2xl text-[var(--jx-muted-label)]">
              {brandIconChar}
            </div>
          )}
          <div>
            <h2 className="text-lg font-medium text-[var(--foreground)]">
              {user.nickname ?? "微信用户"}
            </h2>
            {user.unionId ? (
              <p className="mt-1 text-xs text-[var(--jx-muted-label)]">
                UnionID 已绑定，可在 PC 与微信内共用同一账号
              </p>
            ) : (
              <p className="mt-1 text-xs text-[var(--jx-muted-label)]">
                尚未获取 UnionID，请确保开放平台与公众号已绑定同一主体
              </p>
            )}
          </div>
        </div>

        <dl className="grid gap-3 text-sm">
          <div>
            <dt className="text-[var(--jx-muted-label)]">绑定渠道</dt>
            <dd className="mt-1 text-[var(--foreground)]">
              {user.providers.length
                ? user.providers.map((p) => PROVIDER_LABEL[p] ?? p).join("、")
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-[var(--jx-muted-label)]">同步说明</dt>
            <dd className="mt-1 text-[var(--foreground)] leading-relaxed">
              登录后，本设备的阅读进度、书签与批注会自动合并到您的账号。
              在其他设备登录同一微信后，数据将保持一致。
            </dd>
          </div>
        </dl>

        <AccountActions />

        <p className="text-xs text-[var(--jx-muted-label)]">
          <Link href="/bookmarks" className="underline-offset-2 hover:underline">
            查看收藏
          </Link>
          {" · "}
          <Link href="/about" className="underline-offset-2 hover:underline">
            关于{brandName}
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
