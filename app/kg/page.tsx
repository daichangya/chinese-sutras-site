/**
 * 知识图谱探索页
 * @author 代长亚
 */
import { Suspense } from "react";
import { DiscoveryLayout } from "@/components/layout/discovery-layout";
import { KgExplorer } from "@/components/kg/kg-explorer";
import { getSqlite } from "@/lib/db";
import { brandPageTitleSuffix } from "@/lib/brand";

export const revalidate = 3600;

export const metadata = {
  title: `知识图谱 | ${brandPageTitleSuffix()}`,
  description: "探索译者、经典与佛教知识实体之间的关系",
};

export default function KgPage() {
  getSqlite();
  return (
    <DiscoveryLayout
      label="图谱"
      title="知识图谱"
      description="搜索人物与典籍，在力导向图中探索师承、翻译等关系。支持推荐入口与关系筛选。"
      accent
    >
      <Suspense fallback={<p className="text-sm text-[var(--muted)]">加载图谱…</p>}>
        <KgExplorer />
      </Suspense>
    </DiscoveryLayout>
  );
}
