/**
 * 知识图谱实体搜索 API
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";
import { searchKgEntities } from "@/lib/kg/search";

export async function GET(req: Request) {
  getSqlite();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  const entityType = searchParams.get("type")?.trim() || undefined;
  const limit = parseInt(searchParams.get("limit") ?? "20", 10);

  if (!q) {
    return NextResponse.json({ total: 0, results: [] });
  }

  const result = searchKgEntities({
    q,
    entityType,
    limit: Number.isNaN(limit) ? 20 : limit,
  });
  return NextResponse.json(result);
}
