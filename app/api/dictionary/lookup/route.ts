/**
 * 划选查词 API
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { lookupDictionaryEntries } from "@/lib/db/dict-kg";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "8", 10) || 8, 20);
  const source = searchParams.get("source")?.trim() || undefined;
  if (q.length < 1) {
    return NextResponse.json({ entries: [] });
  }
  try {
    const entries = lookupDictionaryEntries(q, limit, source);
    return NextResponse.json({ entries });
  } catch {
    return NextResponse.json({ entries: [] });
  }
}
