import { notFound } from "next/navigation";
import { ParallelReader } from "@/components/parallel/parallel-reader";
import { getSqlite } from "@/lib/db";
import { getParagraphsForSutra, getSutraBySlug } from "@/lib/sutra/queries";

export const revalidate = 86400;

/**
 * 平行阅读路由 — 单篇经文多版本并排对比
 * /parallel/[slug] 加载一篇经文，左右两栏可选择不同版本展示
 */
export default async function ParallelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  getSqlite();
  const { slug } = await params;
  const sutra = getSutraBySlug(slug);
  if (!sutra) notFound();

  const paragraphs = getParagraphsForSutra(sutra.id);

  return (
    <ParallelReader
      sutra={sutra}
      paragraphs={paragraphs}
    />
  );
}
