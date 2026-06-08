/**
 * GET /api/search — 统一检索 API
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";
import { unifiedSearch } from "@/lib/search/unified";

export async function GET(req: Request) {
  getSqlite();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json(
      { sutras: [], paragraphs: [], dictionary: [], persons: [] },
      {
        headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
      },
    );
  }

  const results = unifiedSearch(q);
  return NextResponse.json(results, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
