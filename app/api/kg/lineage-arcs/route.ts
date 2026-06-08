/**
 * 知识图谱师承弧线 API
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";
import { getKgLineageArcs } from "@/lib/kg/graph";

export async function GET(req: Request) {
  getSqlite();
  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "8000", 10);
  const arcs = getKgLineageArcs(Number.isNaN(limit) ? 8000 : Math.min(limit, 200000));
  return NextResponse.json(
    { arcs, total: arcs.length },
    {
      headers: {
        "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
      },
    },
  );
}
