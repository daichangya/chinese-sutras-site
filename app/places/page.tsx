/**
 * 佛教地理探索页
 * @author 代长亚
 */
import { Suspense } from "react";
import { DiscoveryLayout } from "@/components/layout/discovery-layout";
import { KgMap } from "@/components/kg/kg-map";
import { getSqlite } from "@/lib/db";

export const revalidate = 3600;

export const metadata = {
  title: "佛教地理 | 静心",
  description: "探索佛教圣地、著名寺院与相关地理知识实体",
};

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string }>;
}) {
  getSqlite();
  const { focus } = await searchParams;

  return (
    <DiscoveryLayout
      label="地理"
      title="佛教地理"
      description="在交互地图上浏览圣地、寺院与师承传线。支持类型筛选与地名搜索。"
      accent
    >
      <Suspense fallback={<p className="text-sm text-[var(--muted)]">加载地图…</p>}>
        <KgMap initialFocus={focus} />
      </Suspense>
    </DiscoveryLayout>
  );
}
