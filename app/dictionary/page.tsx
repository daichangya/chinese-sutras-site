/**
 * 字典查询页面 — 服务端组件，接收查询参数并调用字典 API
 * @author 代长亚
 */
import { DictionaryPageClient } from "@/components/dictionary/dictionary-page-client";
import type { Metadata } from "next";

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q = "" } = await searchParams;
  if (q.trim()) {
    return {
      title: `「${q.trim()}」辞典检索 | 静心`,
      description: `查询「${q.trim()}」的佛学辞典释义`,
    };
  }
  return {
    title: "佛学辞典 | 静心",
    description: "多源佛教辞典检索，支持划选查词与繁简转换",
  };
}

export default async function DictionaryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; source?: string }>;
}) {
  const { q = "", source = "" } = await searchParams;
  return <DictionaryPageClient q={q} source={source} />;
}
