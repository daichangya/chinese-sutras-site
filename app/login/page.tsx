/**
 * 登录页
 * @author 代长亚
 */
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { PageShell } from "@/components/ui/page-shell";
import { WechatLoginPanel } from "@/components/auth/wechat-login-panel";
import { isWechatLoginEnabled } from "@/lib/auth/feature";
import {
  getWechatOpenConfig,
  isWechatConfigured,
  wechatCallbackUrl,
} from "@/lib/auth/config";
import { createOAuthState } from "@/lib/auth/wechat/state";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; returnTo?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (!isWechatLoginEnabled()) {
    redirect("/");
  }

  const { error, returnTo } = await searchParams;
  const safeReturn =
    returnTo?.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/account";
  const qrState = await createOAuthState(safeReturn, "qr");
  const openCfg = getWechatOpenConfig();
  const mpConfigured = isWechatConfigured("mp");
  const openConfigured = isWechatConfigured("open");

  return (
    <PageShell narrow className="py-10">
      <PageHeader
        label="登录"
        title="微信登录"
        description="登录后可跨设备同步阅读进度、书签与批注"
      />
      <WechatLoginPanel
        qrState={qrState}
        openAppId={openCfg.appId}
        callbackUrl={wechatCallbackUrl()}
        mpConfigured={mpConfigured}
        openConfigured={openConfigured}
        error={error ?? null}
      />
    </PageShell>
  );
}
