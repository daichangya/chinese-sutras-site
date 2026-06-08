/**
 * 按辞典来源分组的查词 API
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { lookupDictionaryGrouped } from "@/lib/db/dict-kg";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const source = searchParams.get("source")?.trim() || undefined;
  const size = Math.min(parseInt(searchParams.get("size") ?? "10", 10) || 10, 50);

  if (q.length < 1) {
    return NextResponse.json({ query: "", total: 0, groups: [] });
  }

  try {
    const result = lookupDictionaryGrouped(q, { source, size });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ query: q, total: 0, groups: [] });
  }
}
