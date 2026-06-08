/**
 * 知识图谱子图 API
 * @author 代长亚
 */
import { NextResponse } from "next/server";
import { getSqlite } from "@/lib/db";
import { getKgSubgraph, resolveKgCenterId } from "@/lib/kg/graph";

export async function GET(req: Request) {
  getSqlite();
  const { searchParams } = new URL(req.url);
  const centerQuery = searchParams.get("centerId")?.trim() || searchParams.get("slug")?.trim() || undefined;
  const entityType = searchParams.get("entityType")?.trim() || undefined;
  const centerId = centerQuery ? resolveKgCenterId(centerQuery, entityType) : undefined;
  const limit = parseInt(searchParams.get("limit") ?? "80", 10);
  const depth = parseInt(searchParams.get("depth") ?? "1", 10);
  const rels = searchParams.get("rels")?.split(",").filter(Boolean);

  const graph = getKgSubgraph({
    centerId,
    entityType,
    limit: Number.isNaN(limit) ? 80 : limit,
    depth: Number.isNaN(depth) ? 1 : depth,
    predicates: rels?.length ? rels : undefined,
  });
  return NextResponse.json(
    {
      ...graph,
      resolvedCenterId: centerId ?? null,
      centerQuery: centerQuery ?? null,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      },
    },
  );
}
