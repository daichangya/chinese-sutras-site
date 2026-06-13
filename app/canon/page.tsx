/**
 * 经藏浏览 — 按部类探索已导入经典
 * @author 代长亚
 */
import { brandPageTitleSuffix } from "@/lib/brand";
import { CanonBrowser } from "@/components/canon/canon-browser";
import { DiscoveryLayout } from "@/components/layout/discovery-layout";
import { listSutrasGroupedByCategory } from "@/lib/canon/browse";
import { getSqlite } from "@/lib/db";

export const revalidate = 3600;

export const metadata = {
  title: `经藏浏览 | ${brandPageTitleSuffix()}`,
  description: "按汉传大藏部类浏览已收录的经典经目",
};

export default function CanonPage() {
  getSqlite();
  const groups = listSutrasGroupedByCategory();

  return (
    <DiscoveryLayout
      label="经藏"
      title="经藏浏览"
      description={`按汉传大藏部类探索已收录经典。${brandPageTitleSuffix()}聚焦少经深读，经目随语料导入逐步扩充。`}
      accent
    >
      <CanonBrowser groups={groups} />
    </DiscoveryLayout>
  );
}
